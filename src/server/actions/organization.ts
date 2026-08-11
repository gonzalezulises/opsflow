"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { and, asc, eq, gt, isNull } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/server/db";
import {
  users,
  organizations,
  organizationMembers,
  organizationInvites,
} from "@/server/db/schema";
import { isPlatformAdminEmail } from "@/server/auth/platform";
import { requireOrganizationContext } from "@/server/auth/context";
import {
  canInviteToOrganization,
  isValidInviteRole,
} from "@/server/auth/permissions";
import { ACTIVE_ORG_COOKIE } from "@/server/auth/constants";
import { sendOrganizationInviteEmail } from "@/server/email/send-organization-invite";

const RESERVED_SLUGS = new Set([
  "api",
  "www",
  "static",
  "login",
  "auth",
  "invite",
  "dashboard",
  "pending-access",
  "organization",
  "opsflow-demo",
]);

const createOrgSchema = z.object({
  name: z.string().min(2, "Nombre demasiado corto").max(120),
  slug: z
    .string()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug: solo minúsculas, números y guiones",
    )
    .min(2)
    .max(48),
});

function inviteToken(): string {
  return randomBytes(32).toString("hex");
}

const INVITE_ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  facilitator: "Facilitador",
  participant: "Participante",
  observer: "Observador",
  super_admin: "Super administrador",
};

async function ensureAppUserForPlatformAdmin(email: string, fullNameHint: string) {
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(users)
    .values({
      email,
      fullName: fullNameHint || email.split("@")[0] || "Admin",
      role: "admin",
      organizationId: null,
    })
    .returning();

  return created!;
}

/**
 * Crea una organización (tenant) y te asigna como admin.
 * Solo correos listados en `OPSFLOW_PLATFORM_ADMIN_EMAILS`.
 */
export async function createOrganization(
  input: z.input<typeof createOrgSchema>,
) {
  const parsed = createOrgSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.email) {
    return { error: "Debes iniciar sesión para continuar." };
  }

  const email = user.email.toLowerCase();
  if (!isPlatformAdminEmail(email)) {
    return {
      error:
        "Solo los administradores de plataforma pueden crear organizaciones.",
    };
  }

  const slug = parsed.data.slug.toLowerCase();
  if (RESERVED_SLUGS.has(slug)) {
    return { error: "Ese identificador (slug) está reservado." };
  }

  const [slugTaken] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);

  if (slugTaken) {
    return { error: "Ya existe una organización con ese slug." };
  }

  const displayName =
    (typeof user.user_metadata?.full_name === "string" &&
      user.user_metadata.full_name.trim()) ||
    email.split("@")[0] ||
    "Administrador";

  try {
    const appUser = await ensureAppUserForPlatformAdmin(email, displayName);

    const [org] = await db
      .insert(organizations)
      .values({
        name: parsed.data.name.trim(),
        slug,
      })
      .returning();

    if (!org) return { error: "No se pudo crear la organización." };

    await db.insert(organizationMembers).values({
      organizationId: org.id,
      userId: appUser.id,
      role: "admin",
    });

    if (!appUser.organizationId) {
      await db
        .update(users)
        .set({ organizationId: org.id, updatedAt: new Date() })
        .where(eq(users.id, appUser.id));
    }

    const jar = await cookies();
    const isProd = process.env.NODE_ENV === "production";
    jar.set(ACTIVE_ORG_COOKIE, org.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: 60 * 60 * 24 * 400,
    });

    revalidatePath("/", "layout");
    revalidatePath("/dashboard/settings");
    return { data: org };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function getInvitePreview(token: string) {
  const trimmed = token.trim();
  if (!trimmed) return { error: "Token inválido." };

  try {
    const [inv] = await db
      .select({
        email: organizationInvites.email,
        role: organizationInvites.role,
        expiresAt: organizationInvites.expiresAt,
        acceptedAt: organizationInvites.acceptedAt,
        orgName: organizations.name,
        orgSlug: organizations.slug,
      })
      .from(organizationInvites)
      .innerJoin(
        organizations,
        eq(organizations.id, organizationInvites.organizationId),
      )
      .where(eq(organizationInvites.token, trimmed))
      .limit(1);

    if (!inv) return { error: "Invitación no encontrada." };
    if (inv.acceptedAt) return { error: "Esta invitación ya fue aceptada." };
    if (inv.expiresAt <= new Date()) return { error: "Esta invitación expiró." };

    return {
      data: {
        email: inv.email,
        role: inv.role,
        expiresAt: inv.expiresAt,
        organizationName: inv.orgName,
        organizationSlug: inv.orgSlug,
      },
    };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

const createInviteSchema = z.object({
  email: z.string().email("Correo inválido"),
  role: z.string(),
});

export async function createOrganizationInvite(
  input: z.input<typeof createInviteSchema>,
) {
  const parsed = createInviteSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  if (!isValidInviteRole(parsed.data.role)) {
    return { error: "Rol de invitación no permitido." };
  }

  const ctx = await requireOrganizationContext();
  if ("error" in ctx) return { error: ctx.error };

  if (!canInviteToOrganization(ctx.role)) {
    return { error: "No tienes permiso para invitar miembros." };
  }

  const email = parsed.data.email.toLowerCase().trim();

  try {
    const [alreadyMember] = await db
      .select({ id: organizationMembers.id })
      .from(organizationMembers)
      .innerJoin(users, eq(users.id, organizationMembers.userId))
      .where(
        and(
          eq(organizationMembers.organizationId, ctx.organizationId),
          eq(users.email, email),
        ),
      )
      .limit(1);

    if (alreadyMember) {
      return { error: "Ese usuario ya es miembro de la organización." };
    }

    const [pending] = await db
      .select({ id: organizationInvites.id, expiresAt: organizationInvites.expiresAt })
      .from(organizationInvites)
      .where(
        and(
          eq(organizationInvites.organizationId, ctx.organizationId),
          eq(organizationInvites.email, email),
          isNull(organizationInvites.acceptedAt),
          gt(organizationInvites.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (pending) {
      return { error: "Ya hay una invitación pendiente para ese correo." };
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const token = inviteToken();

    await db.insert(organizationInvites).values({
      organizationId: ctx.organizationId,
      email,
      role: parsed.data.role,
      token,
      invitedByUserId: ctx.appUserId,
      expiresAt,
    });

    const [orgRow] = await db
      .select({ name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, ctx.organizationId))
      .limit(1);

    const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
    const inviteUrl = `${baseUrl.replace(/\/$/, "")}/invite/${token}`;

    const roleLabel =
      INVITE_ROLE_LABEL[parsed.data.role] ?? parsed.data.role;
    const emailResult = await sendOrganizationInviteEmail({
      to: email,
      inviteUrl,
      organizationName: orgRow?.name ?? "tu organización",
      roleLabel,
    });

    revalidatePath("/dashboard/settings/members");
    return {
      data: {
        inviteUrl,
        expiresAt,
        emailSent: emailResult.sent,
        emailDeliveryNote:
          emailResult.sent === false
            ? emailResult.reason === "missing_api_key"
              ? "Correo no enviado: falta RESEND_API_KEY (sigue el enlace manual)."
              : emailResult.reason === "missing_from"
                ? "Correo no enviado: falta RESEND_FROM_EMAIL."
                : `Correo no enviado: ${emailResult.detail ?? emailResult.reason}`
            : undefined,
      },
    };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function listPendingOrganizationInvites() {
  try {
    const ctx = await requireOrganizationContext();
    if ("error" in ctx) return { error: ctx.error };

    if (!canInviteToOrganization(ctx.role)) {
      return { error: "No tienes permiso para ver invitaciones." };
    }

    const rows = await db
      .select({
        id: organizationInvites.id,
        email: organizationInvites.email,
        role: organizationInvites.role,
        expiresAt: organizationInvites.expiresAt,
        createdAt: organizationInvites.createdAt,
      })
      .from(organizationInvites)
      .where(
        and(
          eq(organizationInvites.organizationId, ctx.organizationId),
          isNull(organizationInvites.acceptedAt),
          gt(organizationInvites.expiresAt, new Date()),
        ),
      )
      .orderBy(asc(organizationInvites.createdAt));

    return { data: rows };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function acceptOrganizationInvite(token: string) {
  const trimmed = token.trim();
  if (!trimmed) return { error: "Token inválido." };

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.email) {
    return { error: "Debes iniciar sesión para aceptar la invitación." };
  }

  const authEmail = user.email.toLowerCase();

  try {
    const res = await db.transaction(async (tx) => {
      const [inv] = await tx
        .select()
        .from(organizationInvites)
        .where(eq(organizationInvites.token, trimmed))
        .limit(1);

      if (!inv) return { error: "Invitación no encontrada." };
      if (inv.acceptedAt) return { error: "Esta invitación ya fue aceptada." };
      if (inv.expiresAt <= new Date()) return { error: "Esta invitación expiró." };

      if (inv.email !== authEmail) {
        return {
          error:
            "Esta invitación es para otro correo. Inicia sesión con la cuenta invitada.",
        };
      }

      let [appUser] = await tx
        .select()
        .from(users)
        .where(eq(users.email, authEmail))
        .limit(1);

      if (!appUser) {
        const displayName =
          (typeof user.user_metadata?.full_name === "string" &&
            user.user_metadata.full_name.trim()) ||
          authEmail.split("@")[0] ||
          "Usuario";
        const [createdUser] = await tx
          .insert(users)
          .values({
            email: authEmail,
            fullName: displayName,
            role: inv.role,
            organizationId: null,
          })
          .returning();
        appUser = createdUser!;
      }

      const [existingMember] = await tx
        .select({ id: organizationMembers.id })
        .from(organizationMembers)
        .where(
          and(
            eq(organizationMembers.organizationId, inv.organizationId),
            eq(organizationMembers.userId, appUser.id),
          ),
        )
        .limit(1);

      if (!existingMember) {
        await tx.insert(organizationMembers).values({
          organizationId: inv.organizationId,
          userId: appUser.id,
          role: inv.role,
        });
      }

      await tx
        .update(organizationInvites)
        .set({ acceptedAt: new Date(), updatedAt: new Date() })
        .where(eq(organizationInvites.id, inv.id));

      if (!appUser.organizationId) {
        await tx
          .update(users)
          .set({
            organizationId: inv.organizationId,
            updatedAt: new Date(),
          })
          .where(eq(users.id, appUser.id));
      }

      return { data: { organizationId: inv.organizationId } };
    });

    if ("error" in res) return res;

    const jar = await cookies();
    const isProd = process.env.NODE_ENV === "production";
    jar.set(ACTIVE_ORG_COOKIE, res.data.organizationId, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: 60 * 60 * 24 * 400,
    });
    revalidatePath("/", "layout");

    return res;
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function submitOrganizationInviteForm(
  formData: FormData,
): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "participant");
  const res = await createOrganizationInvite({ email, role });
  if ("error" in res) {
    redirect(
      `/dashboard/settings/members?inviteError=${encodeURIComponent(String(res.error))}`,
    );
  }
  const emailQ =
    res.data.emailSent === true
      ? "&inviteEmailSent=1"
      : res.data.emailDeliveryNote
        ? `&inviteEmailSent=0&inviteEmailNote=${encodeURIComponent(res.data.emailDeliveryNote)}`
        : "&inviteEmailSent=0";
  redirect(
    `/dashboard/settings/members?inviteSent=1&inviteUrl=${encodeURIComponent(res.data.inviteUrl)}${emailQ}`,
  );
}

export async function submitAcceptInviteForm(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "").trim();
  const res = await acceptOrganizationInvite(token);
  if ("error" in res) {
    redirect(
      `/invite/${encodeURIComponent(token)}?error=${encodeURIComponent(String(res.error))}`,
    );
  }
  redirect("/dashboard");
}

export async function submitCreateOrganizationForm(
  formData: FormData,
): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const parsed = createOrgSchema.safeParse({ name, slug });
  if (!parsed.success) {
    redirect(
      `/organization/new?error=${encodeURIComponent(String(parsed.error.issues[0]?.message ?? "Datos inválidos"))}`,
    );
  }
  const res = await createOrganization(parsed.data);
  if ("error" in res) {
    redirect(
      `/organization/new?error=${encodeURIComponent(String(res.error))}`,
    );
  }
  redirect("/dashboard");
}

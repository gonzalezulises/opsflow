"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/server/db";
import { organizations } from "@/server/db/schema";
import { requireOrganizationContext } from "@/server/auth/context";
import { canManageOrganizationSettings } from "@/server/auth/permissions";
import {
  assertWeightsSumOne,
  mergeOrgSettings,
  orgPreferencesSchema,
  parseOrgSettingsJson,
  weightsFromForm,
} from "@/lib/organization-settings";

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

const profileSchema = z.object({
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

export async function getOrganizationSettingsPayload() {
  try {
    const ctx = await requireOrganizationContext();
    if ("error" in ctx) return { error: ctx.error };

    const [row] = await db
      .select({
        name: organizations.name,
        slug: organizations.slug,
        settings: organizations.settings,
      })
      .from(organizations)
      .where(eq(organizations.id, ctx.organizationId))
      .limit(1);

    if (!row) return { error: "Organización no encontrada." };

    const prefs = parseOrgSettingsJson(row.settings);
    const canEdit = canManageOrganizationSettings(ctx.role);

    return {
      data: {
        name: row.name,
        slug: row.slug,
        preferences: prefs,
        canEdit,
      },
    };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function submitOrganizationProfileForm(
  formData: FormData,
): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const parsed = profileSchema.safeParse({ name, slug });
  if (!parsed.success) {
    redirect(
      `/dashboard/settings?orgError=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Datos inválidos")}`,
    );
  }

  if (RESERVED_SLUGS.has(parsed.data.slug)) {
    redirect(
      `/dashboard/settings?orgError=${encodeURIComponent("Ese slug está reservado.")}`,
    );
  }

  const ctx = await requireOrganizationContext();
  if ("error" in ctx) {
    redirect(
      `/dashboard/settings?orgError=${encodeURIComponent(ctx.error)}`,
    );
  }

  if (!canManageOrganizationSettings(ctx.role)) {
    redirect(
      `/dashboard/settings?orgError=${encodeURIComponent("No tienes permiso para editar la organización.")}`,
    );
  }

  try {
    const [collision] = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(
        and(
          eq(organizations.slug, parsed.data.slug),
          ne(organizations.id, ctx.organizationId),
        ),
      )
      .limit(1);

    if (collision) {
      redirect(
        `/dashboard/settings?orgError=${encodeURIComponent("Ya existe otra organización con ese slug.")}`,
      );
    }

    await db
      .update(organizations)
      .set({
        name: parsed.data.name,
        slug: parsed.data.slug,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, ctx.organizationId));

    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/settings/members");
    revalidatePath("/", "layout");
    redirect("/dashboard/settings?orgSaved=1");
  } catch (e) {
    redirect(
      `/dashboard/settings?orgError=${encodeURIComponent((e as Error).message)}`,
    );
  }
}

export async function submitOrganizationPreferencesForm(
  formData: FormData,
): Promise<void> {
  const ctx = await requireOrganizationContext();
  if ("error" in ctx) {
    redirect(
      `/dashboard/settings?prefError=${encodeURIComponent(ctx.error)}`,
    );
  }

  if (!canManageOrganizationSettings(ctx.role)) {
    redirect(
      `/dashboard/settings?prefError=${encodeURIComponent("No tienes permiso.")}`,
    );
  }

  const modeRaw = String(formData.get("defaultVsmMode") ?? "lean_correct");
  const defaultVsmMode =
    modeRaw === "compatibility" ? "compatibility" : "lean_correct";

  const nums = {
    impactLeadTime: Number(formData.get("impactLeadTime")),
    impactEconomic: Number(formData.get("impactEconomic")),
    impactResilience: Number(formData.get("impactResilience")),
    feasibility30d: Number(formData.get("feasibility30d")),
    effort: Number(formData.get("effort")),
    externalDependency: Number(formData.get("externalDependency")),
  };

  const wParsed = orgPreferencesSchema.shape.defaultPrioritizationWeights.safeParse(
    nums,
  );
  if (!wParsed.success) {
    redirect(
      `/dashboard/settings?prefError=${encodeURIComponent(wParsed.error.issues[0]?.message ?? "Pesos inválidos")}`,
    );
  }

  const w = weightsFromForm(wParsed.data);
  const sumErr = assertWeightsSumOne(w);
  if (sumErr) {
    redirect(`/dashboard/settings?prefError=${encodeURIComponent(sumErr)}`);
  }

  try {
    const [row] = await db
      .select({ settings: organizations.settings })
      .from(organizations)
      .where(eq(organizations.id, ctx.organizationId))
      .limit(1);

    const nextSettings = mergeOrgSettings(row?.settings ?? {}, {
      defaultVsmMode,
      defaultPrioritizationWeights: wParsed.data,
    });

    await db
      .update(organizations)
      .set({
        settings: nextSettings,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, ctx.organizationId));

    revalidatePath("/dashboard/settings");
    revalidatePath("/", "layout");
    redirect("/dashboard/settings?prefSaved=1");
  } catch (e) {
    redirect(
      `/dashboard/settings?prefError=${encodeURIComponent((e as Error).message)}`,
    );
  }
}

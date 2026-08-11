"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import {
  users,
  organizations,
  organizationMembers,
  caseAssignments,
} from "@/server/db/schema";
import { requireOrganizationContext } from "@/server/auth/context";
import { setActiveOrganization } from "@/server/auth/membership";
import { requireCaseInOrganization } from "@/server/auth/guards";
import { canManageCaseAssignments } from "@/server/auth/permissions";
import { logAuditEvent } from "@/server/auth/audit";

export async function listOrganizationMembers() {
  try {
    const ctx = await requireOrganizationContext();
    if ("error" in ctx) return { error: ctx.error };

    const rows = await db
      .select({
        userId: users.id,
        email: users.email,
        fullName: users.fullName,
        role: organizationMembers.role,
      })
      .from(organizationMembers)
      .innerJoin(users, eq(users.id, organizationMembers.userId))
      .where(eq(organizationMembers.organizationId, ctx.organizationId))
      .orderBy(users.email);

    return { data: rows };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function listMyOrganizations() {
  try {
    const ctx = await requireOrganizationContext();
    if ("error" in ctx) return { error: ctx.error };

    const memberships = await db
      .select({
        organizationId: organizationMembers.organizationId,
        role: organizationMembers.role,
      })
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, ctx.appUserId));

    const out: {
      organizationId: string;
      role: (typeof memberships)[number]["role"];
      name: string;
      isActive: boolean;
    }[] = [];

    for (const m of memberships) {
      const [o] = await db
        .select({ name: organizations.name })
        .from(organizations)
        .where(eq(organizations.id, m.organizationId))
        .limit(1);
      out.push({
        organizationId: m.organizationId,
        role: m.role,
        name: o?.name ?? m.organizationId,
        isActive: m.organizationId === ctx.organizationId,
      });
    }

    return { data: out };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function listCaseAssignees(caseId: string) {
  try {
    const gate = await requireCaseInOrganization(caseId);
    if ("error" in gate) return { error: gate.error };

    const rows = await db
      .select({
        userId: users.id,
        email: users.email,
        fullName: users.fullName,
      })
      .from(caseAssignments)
      .innerJoin(users, eq(users.id, caseAssignments.userId))
      .where(eq(caseAssignments.caseId, caseId))
      .orderBy(asc(users.email));

    return { data: rows };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/**
 * Assigns an org member (by email) as participant on a case. Idempotent.
 */
export async function assignUserToCase(params: {
  caseId: string;
  userEmail: string;
}) {
  try {
    const ctx = await requireOrganizationContext();
    if ("error" in ctx) return { error: ctx.error };

    if (!canManageCaseAssignments(ctx.role)) {
      return { error: "No tienes permiso para asignar participantes." };
    }

    const gate = await requireCaseInOrganization(params.caseId);
    if ("error" in gate) return { error: gate.error };

    const email = params.userEmail.toLowerCase().trim();
    const [assignee] = await db
      .select({ id: users.id })
      .from(users)
      .innerJoin(
        organizationMembers,
        eq(organizationMembers.userId, users.id),
      )
      .where(
        and(
          eq(users.email, email),
          eq(organizationMembers.organizationId, ctx.organizationId),
        ),
      )
      .limit(1);

    if (!assignee) {
      return { error: "Usuario no encontrado en esta organización." };
    }

    const [existing] = await db
      .select({ id: caseAssignments.id })
      .from(caseAssignments)
      .where(
        and(
          eq(caseAssignments.caseId, params.caseId),
          eq(caseAssignments.userId, assignee.id),
        ),
      )
      .limit(1);

    if (!existing) {
      await db.insert(caseAssignments).values({
        caseId: params.caseId,
        userId: assignee.id,
      });
    }

    revalidatePath(`/dashboard/cases/${params.caseId}`);
    revalidatePath("/dashboard/cases");
    return { data: { ok: true as const } };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

/**
 * Removes a user's case assignment. Does not remove org membership.
 */
export async function unassignUserFromCase(params: {
  caseId: string;
  userId: string;
}) {
  try {
    const ctx = await requireOrganizationContext();
    if ("error" in ctx) return { error: ctx.error };

    if (!canManageCaseAssignments(ctx.role)) {
      return { error: "No tienes permiso para quitar participantes." };
    }

    const gate = await requireCaseInOrganization(params.caseId);
    if ("error" in gate) return { error: gate.error };

    const [target] = await db
      .select({ email: users.email })
      .from(users)
      .innerJoin(
        organizationMembers,
        eq(organizationMembers.userId, users.id),
      )
      .where(
        and(
          eq(users.id, params.userId),
          eq(organizationMembers.organizationId, ctx.organizationId),
        ),
      )
      .limit(1);

    if (!target) {
      return { error: "Usuario no pertenece a esta organización." };
    }

    const [removed] = await db
      .delete(caseAssignments)
      .where(
        and(
          eq(caseAssignments.caseId, params.caseId),
          eq(caseAssignments.userId, params.userId),
        ),
      )
      .returning({ id: caseAssignments.id });

    if (!removed) {
      return { error: "No había asignación para ese usuario en este caso." };
    }

    await logAuditEvent({
      ctx,
      caseId: params.caseId,
      eventType: "case.unassign_participant",
      entityType: "case_assignment",
      entityId: params.caseId,
      newData: { userId: params.userId, email: target.email },
    });

    revalidatePath(`/dashboard/cases/${params.caseId}`);
    revalidatePath("/dashboard/cases");
    return { data: { ok: true as const } };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function switchActiveOrganizationAction(
  formData: FormData,
): Promise<void> {
  const raw = formData.get("organizationId");
  if (typeof raw !== "string") {
    redirect("/dashboard/settings/members");
  }

  const res = await setActiveOrganization(raw);
  if ("error" in res) {
    redirect("/dashboard/settings/members");
  }

  revalidatePath("/", "layout");
  redirect("/dashboard/settings/members");
}

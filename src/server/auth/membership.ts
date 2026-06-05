"use server";

import { and, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/server/db";
import { users, organizationMembers } from "@/server/db/schema";
import { getOrCreateDefaultOrg } from "@/server/db/org";
import type { MembershipAuthError, OrganizationContext } from "./types";
import { ACTIVE_ORG_COOKIE } from "./constants";
import { isStrictTenancy } from "./platform";

type AuthError = MembershipAuthError;

async function syncLegacyMembershipRow(
  userId: string,
  orgId: string,
  role: OrganizationContext["role"],
): Promise<void> {
  const [existing] = await db
    .select({ id: organizationMembers.id })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.organizationId, orgId),
      ),
    )
    .limit(1);

  if (existing) return;

  await db.insert(organizationMembers).values({
    organizationId: orgId,
    userId,
    role,
  });
}

async function loadMemberships(userId: string) {
  return db
    .select({
      organizationId: organizationMembers.organizationId,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .where(eq(organizationMembers.userId, userId));
}

function noMembershipError(): AuthError {
  return {
    error:
      "Tu cuenta no tiene una organización activa. Acepta una invitación o pide acceso a un administrador.",
    code: "NO_MEMBERSHIP",
  };
}

/**
 * Resolves Supabase session → app user + active organization membership.
 * Role and organizationId come from `organization_members` (ADR-004).
 *
 * With `OPSFLOW_STRICT_TENANCY=true`, new users are not auto-attached to the
 * demo org; they must accept an invite first.
 */
export async function requireMembershipContext(): Promise<
  OrganizationContext | AuthError
> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.email) {
    return { error: "Debes iniciar sesión para continuar." };
  }

  const email = user.email.toLowerCase();

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  let row = existing;

  if (!row) {
    const displayName =
      (typeof user.user_metadata?.full_name === "string" &&
        user.user_metadata.full_name.trim()) ||
      email.split("@")[0] ||
      "Usuario";

    if (isStrictTenancy()) {
      await db.insert(users).values({
        email,
        fullName: displayName,
        role: "participant",
        organizationId: null,
      });
      return noMembershipError();
    }

    const orgId = await getOrCreateDefaultOrg();

    const [created] = await db
      .insert(users)
      .values({
        email,
        fullName: displayName,
        role: "facilitator",
        organizationId: orgId,
      })
      .returning();

    row = created;
    await syncLegacyMembershipRow(row.id, orgId, row.role);
  } else if (row.organizationId) {
    await syncLegacyMembershipRow(row.id, row.organizationId, row.role);
  }

  let memberships = await loadMemberships(row.id);

  if (memberships.length === 0 && row.organizationId) {
    await syncLegacyMembershipRow(row.id, row.organizationId, row.role);
    memberships = await loadMemberships(row.id);
  }

  if (memberships.length === 0) {
    return noMembershipError();
  }

  const cookieStore = await cookies();
  const cookieOrgId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value ?? null;

  const activeOrgId =
    cookieOrgId && memberships.some((m) => m.organizationId === cookieOrgId)
      ? cookieOrgId
      : memberships[0]!.organizationId;

  const activeMembership =
    memberships.find((m) => m.organizationId === activeOrgId) ??
    memberships[0]!;

  return {
    appUserId: row.id,
    organizationId: activeMembership.organizationId,
    email: row.email,
    role: activeMembership.role,
  };
}

export async function setActiveOrganization(
  organizationId: string,
): Promise<{ data: true } | AuthError> {
  const base = await requireMembershipContext();
  if ("error" in base) return base;

  const memberships = await loadMemberships(base.appUserId);
  const allowed = memberships.some((m) => m.organizationId === organizationId);
  if (!allowed) {
    return { error: "No perteneces a esa organización." };
  }

  const jar = await cookies();
  const isProd = process.env.NODE_ENV === "production";
  jar.set(ACTIVE_ORG_COOKIE, organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: 60 * 60 * 24 * 400,
  });

  return { data: true };
}

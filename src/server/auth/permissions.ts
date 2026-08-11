import type { AppUserRole } from "./types";
import { isReadOnlyRole } from "./roles";

export function canCreateCases(role: AppUserRole): boolean {
  if (isReadOnlyRole(role)) return false;
  return (
    role === "super_admin" || role === "admin" || role === "facilitator"
  );
}

export function canDeleteCase(role: AppUserRole): boolean {
  return (
    role === "super_admin" || role === "admin" || role === "facilitator"
  );
}

export function canManageCaseAssignments(role: AppUserRole): boolean {
  return (
    role === "super_admin" || role === "admin" || role === "facilitator"
  );
}

export function canInviteToOrganization(role: AppUserRole): boolean {
  if (isReadOnlyRole(role)) return false;
  return (
    role === "super_admin" || role === "admin" || role === "facilitator"
  );
}

/** Perfil y preferencias del tenant (nombre, slug, settings JSON). */
export function canManageOrganizationSettings(role: AppUserRole): boolean {
  if (isReadOnlyRole(role)) return false;
  return (
    role === "super_admin" || role === "admin" || role === "facilitator"
  );
}

const ORG_INVITE_ROLES = [
  "admin",
  "facilitator",
  "participant",
  "observer",
] as const satisfies readonly AppUserRole[];

export function isValidInviteRole(
  role: string,
): role is (typeof ORG_INVITE_ROLES)[number] {
  return (ORG_INVITE_ROLES as readonly string[]).includes(role);
}

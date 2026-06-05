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

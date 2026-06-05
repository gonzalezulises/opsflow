import type { OrganizationContext } from "./types";

export function isReadOnlyRole(role: OrganizationContext["role"]): boolean {
  return role === "observer";
}

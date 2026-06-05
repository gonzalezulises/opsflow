import { users } from "@/server/db/schema";

export type AppUserRole = (typeof users.$inferSelect)["role"];

export type OrganizationContext = {
  appUserId: string;
  organizationId: string;
  email: string;
  role: AppUserRole;
};

/** Returned by requireMembershipContext when the user cannot resolve a tenant. */
export type MembershipErrorCode = "NO_MEMBERSHIP";

export type MembershipAuthError = {
  error: string;
  code?: MembershipErrorCode;
};

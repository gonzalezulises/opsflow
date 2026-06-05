import { users } from "@/server/db/schema";

export type AppUserRole = (typeof users.$inferSelect)["role"];

export type OrganizationContext = {
  appUserId: string;
  organizationId: string;
  email: string;
  role: AppUserRole;
};

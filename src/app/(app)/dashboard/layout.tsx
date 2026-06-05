import { redirect } from "next/navigation";
import { requireOrganizationContext } from "@/server/auth/context";

export default async function DashboardSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireOrganizationContext();
  if ("error" in ctx && ctx.code === "NO_MEMBERSHIP") {
    redirect("/pending-access");
  }
  if ("error" in ctx) {
    redirect("/login");
  }

  return <>{children}</>;
}

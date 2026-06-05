import { CaseNav } from "@/features/cases/components/case-nav";
import { ReadOnlyCaseBanner } from "@/features/cases/components/read-only-case-banner";
import { CaseAssignmentsBar } from "@/features/cases/components/case-assignments-bar";
import { getCasePermissions } from "@/server/auth/guards";
import { requireOrganizationContext } from "@/server/auth/context";
import { canManageCaseAssignments } from "@/server/auth/permissions";
import { listCaseAssignees } from "@/server/actions/org-members";

export default async function CaseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const perm = await getCasePermissions(caseId);
  const showReadOnly = !("error" in perm) && perm.readOnly;

  const ctx = await requireOrganizationContext();
  const assigneesRes =
    "error" in ctx ? { error: ctx.error } : await listCaseAssignees(caseId);
  const assignees = "data" in assigneesRes ? assigneesRes.data ?? [] : [];
  const canManage =
    !("error" in ctx) && canManageCaseAssignments(ctx.role);

  return (
    <div className="space-y-6">
      {showReadOnly ? <ReadOnlyCaseBanner /> : null}
      <CaseNav />
      <CaseAssignmentsBar
        caseId={caseId}
        initialAssignees={assignees}
        canManage={canManage}
      />
      {children}
    </div>
  );
}

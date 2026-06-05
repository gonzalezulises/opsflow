import { CaseNav } from "@/features/cases/components/case-nav";
import { ReadOnlyCaseBanner } from "@/features/cases/components/read-only-case-banner";
import { getCasePermissions } from "@/server/auth/guards";

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

  return (
    <div className="space-y-6">
      {showReadOnly ? <ReadOnlyCaseBanner /> : null}
      <CaseNav />
      {children}
    </div>
  );
}

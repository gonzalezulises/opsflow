import { CaseNav } from "@/features/cases/components/case-nav";

export default function CaseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ caseId: string }>;
}) {
  return (
    <div className="space-y-6">
      <CaseNav />
      {children}
    </div>
  );
}

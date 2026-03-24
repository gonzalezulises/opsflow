import { WasteTable } from "@/features/waste/components/waste-table";
import { getWasteItems } from "@/server/actions/waste";

export default async function WastePage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const { data: items } = await getWasteItems(caseId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Costo del desperdicio</h2>
        <p className="text-sm text-muted-foreground">
          Cuantifica el impacto económico de cada problema operativo
        </p>
      </div>
      <WasteTable caseId={caseId} initialItems={items ?? []} />
    </div>
  );
}

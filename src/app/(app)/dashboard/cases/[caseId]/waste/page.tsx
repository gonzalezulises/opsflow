import { WasteTable } from "@/features/waste/components/waste-table";
import { ModulePage } from "@/components/shared/module-page";
import { MODULE_GUIDES } from "@/lib/constants/guides";
import { getWasteItems } from "@/server/actions/waste";

export default async function WastePage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const { data: items } = await getWasteItems(caseId);

  return (
    <ModulePage guide={MODULE_GUIDES.waste}>
      <WasteTable caseId={caseId} initialItems={items ?? []} />
    </ModulePage>
  );
}

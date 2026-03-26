"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { VSMTable } from "./vsm-table";
import { VSMComparisonView } from "./vsm-comparison";
import { calculateVSM, compareVSM, diffSteps, generateImprovementNarrative, type ProcessStep } from "@/lib/calculations/vsm";
import { cloneCurrentToFuture, deleteFutureVSM } from "@/server/actions/vsm";
import { GitBranch, Copy, Trash2, BarChart3, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface DBProcessStep {
  id: string;
  caseId: string;
  orderIndex: number;
  stepName: string;
  department: string | null;
  processTimeMinutes: string | null;
  waitTimeHours: string | null;
  reworkPercentage: string | null;
  systemUsed: string | null;
  wip: number | null;
  addsValue: boolean | null;
  observations: string | null;
  justification: string | null;
  linkedInitiativeIds: string[] | null;
  vsmState: "current" | "future";
  sourceStepId: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

function toCalcSteps(steps: DBProcessStep[]): ProcessStep[] {
  return steps.map((s) => ({
    processTimeMinutes: Number(s.processTimeMinutes) || 0,
    waitTimeHours: Number(s.waitTimeHours) || 0,
    reworkPercentage: Number(s.reworkPercentage) || 0,
    addsValue: s.addsValue ?? false,
  }));
}

export interface InitiativeOption {
  id: string;
  name: string;
  classification: string | null;
}

interface VSMFutureManagerProps {
  caseId: string;
  currentSteps: DBProcessStep[];
  futureSteps: DBProcessStep[];
  futureExists: boolean;
  initiatives?: InitiativeOption[];
}

export function VSMFutureManager({
  caseId,
  currentSteps,
  futureSteps,
  futureExists,
  initiatives = [],
}: VSMFutureManagerProps) {
  const router = useRouter();
  const [cloning, setCloning] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { comparison, narrative, diffs } = useMemo(() => {
    if (!futureExists || futureSteps.length === 0) return { comparison: null, narrative: null, diffs: [] };
    const current = calculateVSM(toCalcSteps(currentSteps));
    const future = calculateVSM(toCalcSteps(futureSteps));
    const comp = compareVSM(current, future);

    const currentRaw = currentSteps.map((s) => ({
      id: s.id,
      stepName: s.stepName,
      processTimeMinutes: Number(s.processTimeMinutes) || 0,
      waitTimeHours: Number(s.waitTimeHours) || 0,
      reworkPercentage: Number(s.reworkPercentage) || 0,
      sourceStepId: s.sourceStepId,
      justification: s.justification ?? "",
      linkedInitiativeIds: s.linkedInitiativeIds ?? [],
    }));
    const futureRaw = futureSteps.map((s) => ({
      id: s.id,
      stepName: s.stepName,
      processTimeMinutes: Number(s.processTimeMinutes) || 0,
      waitTimeHours: Number(s.waitTimeHours) || 0,
      reworkPercentage: Number(s.reworkPercentage) || 0,
      sourceStepId: s.sourceStepId,
      justification: s.justification ?? "",
      linkedInitiativeIds: s.linkedInitiativeIds ?? [],
    }));

    const diffs = diffSteps(currentRaw, futureRaw);
    const narr = generateImprovementNarrative(comp, diffs);

    return { comparison: comp, narrative: narr, diffs };
  }, [currentSteps, futureSteps, futureExists]);

  async function handleClone() {
    setCloning(true);
    const result = await cloneCurrentToFuture(caseId);
    setCloning(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("VSM futuro creado — edítalo en la pestaña Estado Futuro");
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar el VSM futuro? Esta acción no se puede deshacer.")) return;
    setDeleting(true);
    const result = await deleteFutureVSM(caseId);
    setDeleting(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("VSM futuro eliminado");
      router.refresh();
    }
  }

  const justifiedSteps = futureSteps.map((s) => ({
    name: s.stepName,
    justification: s.justification ?? "",
  }));

  return (
    <Tabs defaultValue="current">
      <div className="flex items-center justify-between gap-4 mb-4">
        <TabsList variant="line" className="justify-start border-b pb-0">
          <TabsTrigger value="current" className="gap-1.5">
            <GitBranch className="size-4" />
            Estado Actual
          </TabsTrigger>
          {futureExists && (
            <>
              <TabsTrigger value="future" className="gap-1.5">
                <Copy className="size-4" />
                Estado Futuro
              </TabsTrigger>
              <TabsTrigger value="compare" className="gap-1.5">
                <BarChart3 className="size-4" />
                Comparación
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <div className="flex gap-2 shrink-0">
          {!futureExists && currentSteps.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClone} disabled={cloning}>
              {cloning ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Copy className="mr-2 size-4" />}
              Crear VSM futuro
            </Button>
          )}
          {futureExists && (
            <Button variant="ghost" size="sm" onClick={handleDelete} disabled={deleting} className="text-destructive hover:text-destructive">
              {deleting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Trash2 className="mr-2 size-4" />}
              Eliminar futuro
            </Button>
          )}
        </div>
      </div>

      <TabsContent value="current">
        <VSMTable caseId={caseId} initialSteps={currentSteps} state="current" />
      </TabsContent>

      {futureExists && (
        <>
          <TabsContent value="future">
            <VSMTable caseId={caseId} initialSteps={futureSteps} state="future" initiatives={initiatives} />
          </TabsContent>

          <TabsContent value="compare">
            {comparison && narrative ? (
              <VSMComparisonView comparison={comparison} narrative={narrative} futureSteps={justifiedSteps} initiatives={initiatives} stepDiffs={diffs} />
            ) : (
              <p className="py-8 text-center text-muted-foreground">
                Guarda cambios en el VSM futuro para ver la comparación.
              </p>
            )}
          </TabsContent>
        </>
      )}
    </Tabs>
  );
}

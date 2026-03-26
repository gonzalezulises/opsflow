"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { calculateVSM, type ProcessStep } from "@/lib/calculations/vsm";
import { VSMSummary } from "./vsm-summary";
import { saveAllProcessSteps } from "@/server/actions/vsm";
import { SaveBar } from "@/components/shared/save-bar";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { toast } from "sonner";

interface StepRow {
  id: string;
  name: string;
  department: string;
  processTimeMinutes: number;
  waitTimeHours: number;
  reworkPercentage: number;
  system: string;
  addsValue: boolean;
  observations: string;
  justification: string;
}

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
  vsmState: "current" | "future";
  sourceStepId: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

function dbToRow(step: DBProcessStep): StepRow {
  return {
    id: step.id,
    name: step.stepName,
    department: step.department ?? "",
    processTimeMinutes: Number(step.processTimeMinutes) || 0,
    waitTimeHours: Number(step.waitTimeHours) || 0,
    reworkPercentage: Number(step.reworkPercentage) || 0,
    system: step.systemUsed ?? "",
    addsValue: step.addsValue ?? false,
    observations: step.observations ?? "",
    justification: step.justification ?? "",
  };
}

interface VSMTableProps {
  caseId: string;
  initialSteps: DBProcessStep[];
  state?: "current" | "future";
}

export function VSMTable({ caseId, initialSteps, state = "current" }: VSMTableProps) {
  const isFuture = state === "future";
  const [steps, setSteps] = useState<StepRow[]>(
    initialSteps.length > 0 ? initialSteps.map(dbToRow) : [],
  );
  const [isPending, startTransition] = useTransition();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { dirty, markDirty, markClean } = useUnsavedChanges();
  const [mode, setMode] = useState<"lean_correct" | "compatibility">(
    "lean_correct"
  );

  const processSteps: ProcessStep[] = useMemo(
    () =>
      steps.map((s) => ({
        processTimeMinutes: s.processTimeMinutes,
        waitTimeHours: s.waitTimeHours,
        reworkPercentage: s.reworkPercentage,
        addsValue: s.addsValue,
      })),
    [steps]
  );

  const vsmResult = useMemo(
    () => calculateVSM(processSteps, mode),
    [processSteps, mode]
  );

  const updateStep = useCallback(
    <K extends keyof StepRow>(id: string, field: K, value: StepRow[K]) => {
      setSteps((prev) =>
        prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
      );
      markDirty();
    },
    [markDirty]
  );

  const addStep = useCallback(() => {
    setSteps((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: "",
        department: "",
        processTimeMinutes: 0,
        waitTimeHours: 0,
        reworkPercentage: 0,
        system: "",
        addsValue: false,
        observations: "",
        justification: "",
      },
    ]);
    markDirty();
  }, [markDirty]);

  const deleteStep = useCallback((id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
    markDirty();
  }, [markDirty]);

  const handleNumericChange = useCallback(
    (id: string, field: keyof StepRow, rawValue: string) => {
      const value = parseFloat(rawValue);
      updateStep(id, field, (isNaN(value) ? 0 : value) as StepRow[keyof StepRow]);
    },
    [updateStep]
  );

  const handleSave = useCallback(() => {
    setSaveError(null);
    startTransition(async () => {
      const dbSteps = steps.map((s, index) => ({
        caseId,
        orderIndex: index,
        stepName: s.name,
        department: s.department,
        processTimeMinutes: String(s.processTimeMinutes),
        waitTimeHours: String(s.waitTimeHours),
        reworkPercentage: String(s.reworkPercentage),
        systemUsed: s.system,
        addsValue: s.addsValue,
        observations: s.observations,
        justification: s.justification || undefined,
      }));
      const result = await saveAllProcessSteps(caseId, dbSteps, state);
      if (result.error) {
        setSaveError(result.error);
        toast.error(result.error);
      } else {
        markClean();
        setLastSaved(new Date());
        toast.success("VSM guardado");
      }
    });
  }, [steps, caseId, markClean]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">
            Mapa de flujo de valor (VSM)
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="calc-mode" className="text-xs whitespace-nowrap">
                Modo de calculo
              </Label>
              <Switch
                id="calc-mode"
                size="sm"
                checked={mode === "compatibility"}
                onCheckedChange={(checked) =>
                  setMode(checked ? "compatibility" : "lean_correct")
                }
              />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {mode === "lean_correct" ? "Lean correcto" : "Compatibilidad"}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-center">#</TableHead>
                  <TableHead className="min-w-[160px]">Paso</TableHead>
                  <TableHead className="min-w-[120px]">Departamento</TableHead>
                  <TableHead className="w-[100px] text-right">
                    Proceso (min)
                  </TableHead>
                  <TableHead className="w-[100px] text-right">
                    Espera (h)
                  </TableHead>
                  <TableHead className="w-[90px] text-right">
                    Retrabajo (%)
                  </TableHead>
                  <TableHead className="min-w-[90px]">Sistema</TableHead>
                  <TableHead className="w-[80px] text-center">
                    Agrega valor
                  </TableHead>
                  <TableHead className="min-w-[160px]">
                    Observaciones
                  </TableHead>
                  {isFuture && (
                    <TableHead className="min-w-[200px]">
                      Justificación del cambio
                    </TableHead>
                  )}
                  <TableHead className="w-[70px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {steps.map((step, index) => (
                  <TableRow key={step.id}>
                    <TableCell className="text-center text-muted-foreground tabular-nums">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={step.name}
                        onChange={(e) =>
                          updateStep(step.id, "name", e.target.value)
                        }
                        className="h-7 text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={step.department}
                        onChange={(e) =>
                          updateStep(step.id, "department", e.target.value)
                        }
                        className="h-7 text-xs"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        value={step.processTimeMinutes}
                        onChange={(e) =>
                          handleNumericChange(
                            step.id,
                            "processTimeMinutes",
                            e.target.value
                          )
                        }
                        className="h-7 w-20 text-xs text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        step={0.5}
                        value={step.waitTimeHours}
                        onChange={(e) =>
                          handleNumericChange(
                            step.id,
                            "waitTimeHours",
                            e.target.value
                          )
                        }
                        className="h-7 w-20 text-xs text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={step.reworkPercentage}
                        onChange={(e) =>
                          handleNumericChange(
                            step.id,
                            "reworkPercentage",
                            e.target.value
                          )
                        }
                        className="h-7 w-20 text-xs text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={step.system}
                        onChange={(e) =>
                          updateStep(step.id, "system", e.target.value)
                        }
                        className="h-7 text-xs"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        size="sm"
                        checked={step.addsValue}
                        onCheckedChange={(checked) =>
                          updateStep(step.id, "addsValue", checked)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={step.observations}
                        onChange={(e) =>
                          updateStep(step.id, "observations", e.target.value)
                        }
                        className="h-7 text-xs"
                      />
                    </TableCell>
                    {isFuture && (
                      <TableCell>
                        <Input
                          value={step.justification}
                          onChange={(e) =>
                            updateStep(step.id, "justification", e.target.value)
                          }
                          placeholder="¿Por qué este cambio?"
                          className="h-7 text-xs"
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => deleteStep(step.id)}
                        aria-label="Eliminar paso"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-4">
            <SaveBar dirty={dirty} saving={isPending} lastSaved={lastSaved} error={saveError} onSave={handleSave} label="Guardar VSM">
              <Button variant="outline" size="sm" onClick={addStep}>
                Agregar paso
              </Button>
            </SaveBar>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div>
        <h3 className="mb-4 text-base font-semibold">Resumen VSM</h3>
        <VSMSummary result={vsmResult} />
      </div>
    </div>
  );
}

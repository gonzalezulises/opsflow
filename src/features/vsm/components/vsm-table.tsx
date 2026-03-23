"use client";

import { useState, useMemo, useCallback } from "react";
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
}

const INITIAL_STEPS: StepRow[] = [
  {
    id: crypto.randomUUID(),
    name: "Recepcion del pedido",
    department: "Ventas",
    processTimeMinutes: 15,
    waitTimeHours: 4,
    reworkPercentage: 5,
    system: "ERP",
    addsValue: true,
    observations: "",
  },
  {
    id: crypto.randomUUID(),
    name: "Verificacion crediticia",
    department: "Finanzas",
    processTimeMinutes: 20,
    waitTimeHours: 24,
    reworkPercentage: 11,
    system: "ERP",
    addsValue: false,
    observations: "Hold financiero frecuente",
  },
  {
    id: crypto.randomUUID(),
    name: "Planificacion de produccion",
    department: "Planificacion",
    processTimeMinutes: 30,
    waitTimeHours: 12,
    reworkPercentage: 8,
    system: "Excel",
    addsValue: true,
    observations: "",
  },
  {
    id: crypto.randomUUID(),
    name: "Picking y empaque",
    department: "Almacen",
    processTimeMinutes: 45,
    waitTimeHours: 8,
    reworkPercentage: 9,
    system: "WMS",
    addsValue: true,
    observations: "Retrabajo por errores de picking",
  },
  {
    id: crypto.randomUUID(),
    name: "Control de calidad",
    department: "Calidad",
    processTimeMinutes: 20,
    waitTimeHours: 6,
    reworkPercentage: 4,
    system: "Manual",
    addsValue: false,
    observations: "",
  },
  {
    id: crypto.randomUUID(),
    name: "Despacho y transporte",
    department: "Logistica",
    processTimeMinutes: 25,
    waitTimeHours: 12,
    reworkPercentage: 3,
    system: "TMS",
    addsValue: true,
    observations: "",
  },
];

interface VSMTableProps {
  caseId: string;
}

export function VSMTable({ caseId }: VSMTableProps) {
  const [steps, setSteps] = useState<StepRow[]>(INITIAL_STEPS);
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
    },
    []
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
      },
    ]);
  }, []);

  const deleteStep = useCallback((id: string) => {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleNumericChange = useCallback(
    (id: string, field: keyof StepRow, rawValue: string) => {
      const value = parseFloat(rawValue);
      updateStep(id, field, (isNaN(value) ? 0 : value) as StepRow[keyof StepRow]);
    },
    [updateStep]
  );

  // Suppress unused variable warning - caseId will be used for persistence
  void caseId;

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
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" onClick={addStep}>
              Agregar paso
            </Button>
            <Button size="sm">Guardar</Button>
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

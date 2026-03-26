"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Loader2, Trophy, ArrowDown, ArrowUp, Minus } from "lucide-react";
import { calculateVSM, type ProcessStep, type VSMResult } from "@/lib/calculations/vsm";
import { createScenario, deleteScenario } from "@/server/actions/scenarios";
import { toast } from "sonner";

interface DBStep {
  processTimeMinutes: string | null;
  waitTimeHours: string | null;
  reworkPercentage: string | null;
  addsValue: boolean | null;
}

interface Scenario {
  id: string;
  name: string;
  description: string | null;
  steps: DBStep[];
}

interface ScenarioManagerProps {
  caseId: string;
  currentSteps: DBStep[];
  futureSteps: DBStep[];
  scenarios: Scenario[];
  hasFuture: boolean;
}

function toCalc(steps: DBStep[]): ProcessStep[] {
  return steps.map((s) => ({
    processTimeMinutes: Number(s.processTimeMinutes) || 0,
    waitTimeHours: Number(s.waitTimeHours) || 0,
    reworkPercentage: Number(s.reworkPercentage) || 0,
    addsValue: s.addsValue ?? false,
  }));
}

function fmt(n: number) {
  return n.toFixed(1);
}

function DeltaCell({ current, value, lowerBetter = true }: { current: number; value: number; lowerBetter?: boolean }) {
  const d = value - current;
  if (Math.abs(d) < 0.01) {
    return <span className="flex items-center gap-1 text-muted-foreground"><Minus className="size-3" /> {fmt(value)}</span>;
  }
  const improved = lowerBetter ? d < 0 : d > 0;
  return (
    <span className={`flex items-center gap-1 font-medium ${improved ? "text-emerald-600" : "text-destructive"}`}>
      {improved ? <ArrowDown className="size-3" /> : <ArrowUp className="size-3" />}
      {fmt(value)}
    </span>
  );
}

export function ScenarioManager({
  caseId,
  currentSteps,
  futureSteps,
  scenarios,
  hasFuture,
}: ScenarioManagerProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const currentResult = calculateVSM(toCalc(currentSteps));

  // Build comparison rows: future + all scenarios
  const rows: { id: string; name: string; result: VSMResult; isBest: boolean }[] = [];

  if (hasFuture && futureSteps.length > 0) {
    rows.push({ id: "future", name: "Estado futuro", result: calculateVSM(toCalc(futureSteps)), isBest: false });
  }

  for (const s of scenarios) {
    if (s.steps.length > 0) {
      rows.push({ id: s.id, name: s.name, result: calculateVSM(toCalc(s.steps)), isBest: false });
    }
  }

  // Mark best scenario (lowest lead time)
  if (rows.length > 0) {
    const best = rows.reduce((a, b) => a.result.leadTimeHours < b.result.leadTimeHours ? a : b);
    best.isBest = true;
  }

  async function handleCreate() {
    if (!newName.trim()) {
      toast.error("Ingresa un nombre para el escenario");
      return;
    }
    setCreating(true);
    const result = await createScenario(caseId, newName.trim());
    setCreating(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`Escenario "${newName}" creado`);
      setNewName("");
      setShowForm(false);
      router.refresh();
    }
  }

  async function handleDelete(scenarioId: string) {
    if (!confirm("¿Eliminar este escenario? No se puede deshacer.")) return;
    setDeletingId(scenarioId);
    const result = await deleteScenario(scenarioId);
    setDeletingId(null);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Escenario eliminado");
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      {/* Create scenario */}
      <div className="flex items-center gap-3">
        {showForm ? (
          <>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre del escenario (ej: Escenario agresivo)"
              className="max-w-xs"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <Button onClick={handleCreate} disabled={creating} size="sm">
              {creating ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Plus className="mr-2 size-4" />}
              Crear
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
          </>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="mr-2 size-4" />
            Nuevo escenario
          </Button>
        )}
      </div>

      {/* Comparison table */}
      {rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Comparación de escenarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Escenario</TableHead>
                    <TableHead className="text-right">Lead time (h)</TableHead>
                    <TableHead className="text-right">Espera (h)</TableHead>
                    <TableHead className="text-right">Proceso (min)</TableHead>
                    <TableHead className="text-right">Eficiencia (%)</TableHead>
                    <TableHead className="text-right">Retrabajo (%)</TableHead>
                    <TableHead className="text-right">Pasos</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Current baseline */}
                  <TableRow className="bg-muted/30">
                    <TableCell>
                      <span className="font-medium">Estado actual</span>
                      <Badge variant="outline" className="ml-2 text-xs">Línea base</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{fmt(currentResult.leadTimeHours)}</TableCell>
                    <TableCell className="text-right">{fmt(currentResult.totalWaitTimeHours)}</TableCell>
                    <TableCell className="text-right">{fmt(currentResult.totalProcessTimeMinutes)}</TableCell>
                    <TableCell className="text-right">{fmt(currentResult.flowEfficiency)}</TableCell>
                    <TableCell className="text-right">{fmt(currentResult.avgRework)}</TableCell>
                    <TableCell className="text-right">{currentResult.stepsCount}</TableCell>
                    <TableCell />
                  </TableRow>

                  {/* Scenarios */}
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {row.isBest && <Trophy className="size-4 text-amber-500" />}
                          <span className="font-medium">{row.name}</span>
                          {row.isBest && <Badge className="text-xs bg-amber-500/10 text-amber-700 border-amber-500/30">Mejor</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DeltaCell current={currentResult.leadTimeHours} value={row.result.leadTimeHours} />
                      </TableCell>
                      <TableCell className="text-right">
                        <DeltaCell current={currentResult.totalWaitTimeHours} value={row.result.totalWaitTimeHours} />
                      </TableCell>
                      <TableCell className="text-right">
                        <DeltaCell current={currentResult.totalProcessTimeMinutes} value={row.result.totalProcessTimeMinutes} />
                      </TableCell>
                      <TableCell className="text-right">
                        <DeltaCell current={currentResult.flowEfficiency} value={row.result.flowEfficiency} lowerBetter={false} />
                      </TableCell>
                      <TableCell className="text-right">
                        <DeltaCell current={currentResult.avgRework} value={row.result.avgRework} />
                      </TableCell>
                      <TableCell className="text-right">{row.result.stepsCount}</TableCell>
                      <TableCell>
                        {row.id !== "future" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(row.id)}
                            disabled={deletingId === row.id}
                          >
                            {deletingId === row.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4 text-muted-foreground" />}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Recommendation */}
            {rows.length >= 2 && (() => {
              const best = rows.find((r) => r.isBest);
              if (!best) return null;
              const reduction = currentResult.leadTimeHours - best.result.leadTimeHours;
              const pct = currentResult.leadTimeHours > 0 ? (reduction / currentResult.leadTimeHours) * 100 : 0;
              return (
                <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
                  <p className="text-sm font-medium">
                    <Trophy className="inline size-4 text-amber-500 mr-1" />
                    Recomendación: <strong>{best.name}</strong> ofrece la mayor reducción de lead time
                    ({fmt(reduction)}h / {fmt(pct)}% menos) entre los {rows.length} escenarios evaluados.
                  </p>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {rows.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <p>No hay escenarios para comparar.</p>
            <p className="text-sm mt-1">Crea un VSM futuro o un escenario para empezar.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

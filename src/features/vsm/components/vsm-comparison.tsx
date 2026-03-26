"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { ArrowDown, ArrowUp, Minus, TrendingDown, Zap, FileText, MessageSquareQuote, Link2 } from "lucide-react";
import { type VSMComparison, type ImprovementNarrative, type StepDiff } from "@/lib/calculations/vsm";

function fmt(n: number) {
  return n.toFixed(2);
}

function DeltaBadge({ delta, deltaPct, improved }: { delta: number; deltaPct: number; improved: boolean }) {
  if (delta === 0) {
    return (
      <span className="flex items-center gap-1 text-sm text-muted-foreground">
        <Minus className="size-3" /> Sin cambio
      </span>
    );
  }

  const sign = delta > 0 ? "+" : "";
  return (
    <span className={`flex items-center gap-1 text-sm font-medium ${improved ? "text-emerald-600" : "text-destructive"}`}>
      {improved ? <ArrowDown className="size-3" /> : <ArrowUp className="size-3" />}
      {sign}{fmt(delta)} ({sign}{fmt(deltaPct)}%)
    </span>
  );
}

interface InitiativeOption {
  id: string;
  name: string;
  classification: string | null;
}

interface VSMComparisonViewProps {
  comparison: VSMComparison;
  narrative: ImprovementNarrative;
  futureSteps: { name: string; justification: string }[];
  initiatives?: InitiativeOption[];
  stepDiffs?: StepDiff[];
}

function groupByInitiative(diffs: StepDiff[], initiatives: InitiativeOption[]) {
  const map = new Map<string, { initiative: InitiativeOption; steps: StepDiff[]; totalWaitDelta: number; totalProcessDelta: number }>();
  for (const d of diffs) {
    for (const iid of d.linkedInitiativeIds) {
      if (!map.has(iid)) {
        const init = initiatives.find((i) => i.id === iid);
        if (!init) continue;
        map.set(iid, { initiative: init, steps: [], totalWaitDelta: 0, totalProcessDelta: 0 });
      }
      const entry = map.get(iid)!;
      entry.steps.push(d);
      entry.totalWaitDelta += d.waitDelta;
      entry.totalProcessDelta += d.processDelta;
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    Math.abs(b.totalWaitDelta * 60 + b.totalProcessDelta) - Math.abs(a.totalWaitDelta * 60 + a.totalProcessDelta)
  );
}

export function VSMComparisonView({ comparison, narrative, futureSteps, initiatives = [], stepDiffs = [] }: VSMComparisonViewProps) {
  const { metrics, summary } = comparison;

  return (
    <div className="space-y-6">
      {/* Summary KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className={summary.leadTimeReduction > 0 ? "border-emerald-500/30 bg-emerald-500/5" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <TrendingDown className="size-4" />
              Reducción lead time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmt(summary.leadTimeReduction)}h</p>
            <p className="text-sm text-muted-foreground">{fmt(summary.leadTimeReductionPct)}% menos</p>
          </CardContent>
        </Card>

        <Card className={summary.efficiencyGain > 0 ? "border-emerald-500/30 bg-emerald-500/5" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <Zap className="size-4" />
              Ganancia eficiencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">+{fmt(summary.efficiencyGain)}pp</p>
            <p className="text-sm text-muted-foreground">puntos porcentuales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Pasos eliminados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.stepsRemoved}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Reducción retrabajo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{fmt(summary.reworkReduction)}pp</p>
          </CardContent>
        </Card>
      </div>

      {/* Metrics table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">Comparación de métricas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Métrica</TableHead>
                <TableHead className="text-right">Actual</TableHead>
                <TableHead className="text-right">Futuro</TableHead>
                <TableHead className="text-right">Cambio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.map((m) => (
                <TableRow key={m.label}>
                  <TableCell className="font-medium">{m.label}</TableCell>
                  <TableCell className="text-right">{fmt(m.current)} {m.unit}</TableCell>
                  <TableCell className="text-right">{fmt(m.future)} {m.unit}</TableCell>
                  <TableCell className="text-right">
                    <DeltaBadge delta={m.delta} deltaPct={m.deltaPct} improved={m.improved} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Separator />

      {/* Improvement narrative */}
      <Card className="border-primary/20 bg-primary/[0.02]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <FileText className="size-4 text-primary" />
            Resumen de mejora
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm font-medium leading-relaxed">{narrative.headline}</p>

          {narrative.bullets.length > 0 && (
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {narrative.bullets.map((b, i) => (
                <li key={i} className="flex gap-2">
                  <span className="shrink-0 text-primary">—</span>
                  {b}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Top changes with justifications */}
      {narrative.topChanges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <MessageSquareQuote className="size-4" />
              Top {narrative.topChanges.length} cambios de mayor impacto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {narrative.topChanges.map((change, i) => (
              <div key={i} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge>{i + 1}</Badge>
                  <span className="font-semibold">{change.step}</span>
                </div>
                <p className="text-sm text-muted-foreground">{change.description}</p>
                {change.justification && (
                  <div className="flex items-start gap-2 rounded-md bg-muted/50 p-2.5 text-sm">
                    <MessageSquareQuote className="size-3.5 shrink-0 mt-0.5 text-primary" />
                    <p className="italic text-muted-foreground">&ldquo;{change.justification}&rdquo;</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Impact by initiative */}
      {initiatives.length > 0 && stepDiffs.length > 0 && (() => {
        const grouped = groupByInitiative(stepDiffs, initiatives);
        if (grouped.length === 0) return null;
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Link2 className="size-4" />
                Impacto por iniciativa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {grouped.map((g) => (
                <div key={g.initiative.id} className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={g.initiative.classification === "Atacar ya" ? "default" : "secondary"}>
                      {g.initiative.classification ?? "Sin clasificar"}
                    </Badge>
                    <span className="font-semibold">{g.initiative.name}</span>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    {g.totalWaitDelta !== 0 && (
                      <span className={g.totalWaitDelta < 0 ? "text-emerald-600" : "text-destructive"}>
                        Espera: {g.totalWaitDelta > 0 ? "+" : ""}{fmt(g.totalWaitDelta)}h
                      </span>
                    )}
                    {g.totalProcessDelta !== 0 && (
                      <span className={g.totalProcessDelta < 0 ? "text-emerald-600" : "text-destructive"}>
                        Proceso: {g.totalProcessDelta > 0 ? "+" : ""}{fmt(g.totalProcessDelta)}min
                      </span>
                    )}
                    <span>{g.steps.length} paso(s) afectado(s)</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {g.steps.map((s, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{s.removed ? `${s.name} ✕` : s.futureName || s.name}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })()}

      {/* All justifications */}
      {futureSteps.some((s) => s.justification) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Todas las justificaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {futureSteps
                .filter((s) => s.justification)
                .map((s, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                    <Badge variant="outline" className="shrink-0 mt-0.5">{s.name}</Badge>
                    <p className="text-sm text-muted-foreground">{s.justification}</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

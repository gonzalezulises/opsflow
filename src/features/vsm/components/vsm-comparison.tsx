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
import { ArrowDown, ArrowUp, Minus, TrendingDown, Zap } from "lucide-react";
import { type VSMComparison } from "@/lib/calculations/vsm";

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

interface VSMComparisonViewProps {
  comparison: VSMComparison;
  futureSteps: { name: string; justification: string }[];
}

export function VSMComparisonView({ comparison, futureSteps }: VSMComparisonViewProps) {
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

      {/* Justifications */}
      {futureSteps.some((s) => s.justification) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-bold">Justificación de cambios</CardTitle>
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

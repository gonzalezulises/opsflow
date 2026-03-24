"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, AlertTriangle } from "lucide-react";
import { detectTrends, type WeeklyMetric } from "@/lib/calculations/tracking";
import { saveAllWeeklyMetrics } from "@/server/actions/tracking";
import { toast } from "sonner";

interface MetricRow extends WeeklyMetric {
  id: string;
  notes: string;
  weekStartDate: string;
}

interface WeeklyMetricFromDB {
  id: string;
  caseId: string;
  weekNumber: number;
  weekStartDate: string | null;
  leadTime: string | null;
  otdOtif: string | null;
  pctOrdersCorrected: string | null;
  pctOrdersRescheduled: string | null;
  reworkPicking: string | null;
  planProgress: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

function dbToRow(item: WeeklyMetricFromDB): MetricRow {
  return {
    id: item.id,
    weekNumber: item.weekNumber,
    weekStartDate: item.weekStartDate ?? "",
    leadTime: Number(item.leadTime ?? 0),
    otdOtif: Number(item.otdOtif ?? 0),
    pctOrdersCorrected: Number(item.pctOrdersCorrected ?? 0),
    pctOrdersRescheduled: Number(item.pctOrdersRescheduled ?? 0),
    reworkPicking: Number(item.reworkPicking ?? 0),
    planProgress: Number(item.planProgress ?? 0),
    notes: item.notes ?? "",
  };
}

interface WeeklyTrackingProps {
  caseId: string;
  initialMetrics: WeeklyMetricFromDB[];
}

export function WeeklyTracking({ caseId, initialMetrics }: WeeklyTrackingProps) {
  const [metrics, setMetrics] = useState<MetricRow[]>(
    initialMetrics.map(dbToRow),
  );
  const [saving, setSaving] = useState(false);

  const weeklyMetrics: WeeklyMetric[] = metrics.map(({ id, notes, weekStartDate, ...rest }) => rest);
  const alerts = detectTrends(weeklyMetrics);

  function updateMetric(id: string, field: string, value: string | number) {
    setMetrics((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  }

  function addWeek() {
    const nextWeek = metrics.length > 0 ? Math.max(...metrics.map((m) => m.weekNumber)) + 1 : 1;
    setMetrics((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        weekNumber: nextWeek,
        weekStartDate: "",
        leadTime: 0,
        otdOtif: 0,
        pctOrdersCorrected: 0,
        pctOrdersRescheduled: 0,
        reworkPicking: 0,
        planProgress: 0,
        notes: "",
      },
    ]);
  }

  async function handleSave() {
    setSaving(true);
    const payload = metrics.map((m) => ({
      caseId,
      weekNumber: m.weekNumber,
      weekStartDate: m.weekStartDate || undefined,
      leadTime: String(m.leadTime),
      otdOtif: String(m.otdOtif),
      pctOrdersCorrected: String(m.pctOrdersCorrected),
      pctOrdersRescheduled: String(m.pctOrdersRescheduled),
      reworkPicking: String(m.reworkPicking),
      planProgress: String(m.planProgress),
      notes: m.notes || undefined,
    }));

    const result = await saveAllWeeklyMetrics(caseId, payload);
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Seguimiento guardado");
    }
  }

  const latest = metrics[metrics.length - 1];

  return (
    <div className="space-y-6">
      {alerts.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <AlertTriangle className="size-4" />
              Alertas de tendencia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {alerts.map((alert) => (
                <li key={alert.metric} className="flex items-center gap-2">
                  <Badge variant="destructive">Deterioro</Badge>
                  <span>
                    <strong>{alert.label}</strong>: {alert.consecutiveWeeks} semanas consecutivas deteriorando
                    (actual: {alert.currentValue})
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {latest && (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Lead Time</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold">{latest.leadTime} días</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">OTD/OTIF</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold">{latest.otdOtif}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Pedidos corregidos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold">{latest.pctOrdersCorrected}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Reprogramadas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold">{latest.pctOrdersRescheduled}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Retrabajo picking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold">{latest.reworkPicking}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Avance plan</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold">{latest.planProgress}%</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20 text-center">Semana</TableHead>
              <TableHead className="w-24 text-center">Lead Time</TableHead>
              <TableHead className="w-24 text-center">OTD/OTIF %</TableHead>
              <TableHead className="w-24 text-center">Corregidos %</TableHead>
              <TableHead className="w-24 text-center">Reprogram. %</TableHead>
              <TableHead className="w-24 text-center">Retrabajo %</TableHead>
              <TableHead className="w-24 text-center">Avance %</TableHead>
              <TableHead className="min-w-[150px]">Notas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="text-center font-medium">S{m.weekNumber}</TableCell>
                <TableCell>
                  <Input type="number" step="0.1" value={m.leadTime} onChange={(e) => updateMetric(m.id, "leadTime", Number(e.target.value))} className="h-8 w-20 text-center" />
                </TableCell>
                <TableCell>
                  <Input type="number" value={m.otdOtif} onChange={(e) => updateMetric(m.id, "otdOtif", Number(e.target.value))} className="h-8 w-20 text-center" />
                </TableCell>
                <TableCell>
                  <Input type="number" value={m.pctOrdersCorrected} onChange={(e) => updateMetric(m.id, "pctOrdersCorrected", Number(e.target.value))} className="h-8 w-20 text-center" />
                </TableCell>
                <TableCell>
                  <Input type="number" value={m.pctOrdersRescheduled} onChange={(e) => updateMetric(m.id, "pctOrdersRescheduled", Number(e.target.value))} className="h-8 w-20 text-center" />
                </TableCell>
                <TableCell>
                  <Input type="number" value={m.reworkPicking} onChange={(e) => updateMetric(m.id, "reworkPicking", Number(e.target.value))} className="h-8 w-20 text-center" />
                </TableCell>
                <TableCell>
                  <Input type="number" value={m.planProgress} onChange={(e) => updateMetric(m.id, "planProgress", Number(e.target.value))} className="h-8 w-20 text-center" />
                </TableCell>
                <TableCell>
                  <Textarea value={m.notes} onChange={(e) => updateMetric(m.id, "notes", e.target.value)} rows={1} className="min-h-8 resize-none text-sm" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={addWeek}>
          <Plus className="mr-2 size-4" />
          Agregar semana
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Guardando..." : "Guardar seguimiento"}
        </Button>
      </div>
    </div>
  );
}

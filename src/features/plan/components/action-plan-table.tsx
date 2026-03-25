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
import { Plus, Trash2, Sparkles, Loader2 } from "lucide-react";
import { saveAllActionItems } from "@/server/actions/plan";
import { generateFromAI } from "@/server/actions/ai";
import { AIPanel } from "@/components/shared/ai-panel";
import { toast } from "sonner";
import type { ActionPlanGeneration } from "@/server/ai/schemas";

type ActionStatus = "pending" | "in_progress" | "completed" | "blocked" | "cancelled";

interface ActionRow {
  id: string;
  action: string;
  responsible: string;
  startDate: string;
  endDate: string;
  leadMetric: string;
  baselineValue: string;
  targetValue: string;
  contingency: string;
  status: ActionStatus;
  initiativeId: string | null;
}

interface ActionItemFromDB {
  id: string;
  caseId: string;
  initiativeId: string | null;
  actionDescription: string;
  responsible: string | null;
  startDate: string | null;
  endDate: string | null;
  leadMetric: string | null;
  baselineValue: string | null;
  targetValue: string | null;
  contingency: string | null;
  status: "pending" | "in_progress" | "completed" | "blocked" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

function dbToRow(item: ActionItemFromDB): ActionRow {
  return {
    id: item.id,
    action: item.actionDescription,
    responsible: item.responsible ?? "",
    startDate: item.startDate ?? "",
    endDate: item.endDate ?? "",
    leadMetric: item.leadMetric ?? "",
    baselineValue: item.baselineValue ?? "",
    targetValue: item.targetValue ?? "",
    contingency: item.contingency ?? "",
    status: item.status,
    initiativeId: item.initiativeId,
  };
}

const STATUS_OPTIONS: { value: ActionStatus; label: string }[] = [
  { value: "pending", label: "Pendiente" },
  { value: "in_progress", label: "En progreso" },
  { value: "completed", label: "Completada" },
  { value: "blocked", label: "Bloqueada" },
  { value: "cancelled", label: "Cancelada" },
];

function statusBadge(status: ActionStatus) {
  const variants: Record<ActionStatus, "secondary" | "default" | "outline" | "destructive"> = {
    pending: "secondary",
    in_progress: "default",
    completed: "outline",
    blocked: "destructive",
    cancelled: "secondary",
  };
  const labels: Record<ActionStatus, string> = {
    pending: "Pendiente",
    in_progress: "En progreso",
    completed: "Completada",
    blocked: "Bloqueada",
    cancelled: "Cancelada",
  };
  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}

interface ActionPlanTableProps {
  caseId: string;
  initialActions: ActionItemFromDB[];
}

export function ActionPlanTable({ caseId, initialActions }: ActionPlanTableProps) {
  const [actions, setActions] = useState<ActionRow[]>(
    initialActions.map(dbToRow),
  );
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  function updateAction(id: string, field: keyof ActionRow, value: string) {
    setActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  }

  function addAction() {
    setActions((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        action: "",
        responsible: "",
        startDate: "",
        endDate: "",
        leadMetric: "",
        baselineValue: "",
        targetValue: "",
        contingency: "",
        status: "pending" as ActionStatus,
        initiativeId: null,
      },
    ]);
  }

  function removeAction(id: string) {
    setActions((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleSave() {
    setSaving(true);
    const payload = actions.map((a) => ({
      caseId,
      initiativeId: a.initiativeId,
      actionDescription: a.action,
      responsible: a.responsible || undefined,
      startDate: a.startDate || undefined,
      endDate: a.endDate || undefined,
      leadMetric: a.leadMetric || undefined,
      baselineValue: a.baselineValue || undefined,
      targetValue: a.targetValue || undefined,
      contingency: a.contingency || undefined,
      status: a.status,
    }));

    const result = await saveAllActionItems(caseId, payload);
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Plan guardado");
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    const result = await generateFromAI(caseId, "action_plan_generation");
    setGenerating(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    const generated = result.data as ActionPlanGeneration;
    if (generated?.actions) {
      const newActions: ActionRow[] = generated.actions.map((a) => ({
        id: crypto.randomUUID(),
        action: a.actionDescription,
        responsible: a.responsible,
        startDate: "",
        endDate: "",
        leadMetric: a.leadMetric,
        baselineValue: a.baselineValue,
        targetValue: a.targetValue,
        contingency: a.contingency,
        status: "pending" as ActionStatus,
        initiativeId: null,
      }));
      setActions((prev) => [...prev, ...newActions]);
      toast.success(`${newActions.length} acciones generadas — revisa y ajusta antes de guardar`);
    }
  }

  function buildContext() {
    return actions.map((a, i) =>
      `${i + 1}. ${a.action} — Responsable: ${a.responsible || "N/A"}, Métrica: ${a.leadMetric || "N/A"}, Base: ${a.baselineValue || "N/A"}, Meta: ${a.targetValue || "N/A"}, Estado: ${a.status}, Contingencia: ${a.contingency || "N/A"}`
    ).join("\n");
  }

  const completedCount = actions.filter((a) => a.status === "completed").length;
  const progressPct = actions.length > 0 ? Math.round((completedCount / actions.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Acciones totales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{actions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{completedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{progressPct}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">#</TableHead>
              <TableHead className="min-w-[200px]">Acción</TableHead>
              <TableHead className="min-w-[120px]">Responsable</TableHead>
              <TableHead className="w-28">Inicio</TableHead>
              <TableHead className="w-28">Fin</TableHead>
              <TableHead className="min-w-[120px]">Métrica líder</TableHead>
              <TableHead className="w-20 text-center">Base</TableHead>
              <TableHead className="w-20 text-center">Meta</TableHead>
              <TableHead className="min-w-[120px]">Contingencia</TableHead>
              <TableHead className="w-32">Estado</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {actions.map((action, idx) => (
              <TableRow key={action.id}>
                <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                <TableCell>
                  <Textarea value={action.action} onChange={(e) => updateAction(action.id, "action", e.target.value)} rows={1} className="min-h-8 resize-none text-sm" />
                </TableCell>
                <TableCell>
                  <Input value={action.responsible} onChange={(e) => updateAction(action.id, "responsible", e.target.value)} className="h-8" />
                </TableCell>
                <TableCell>
                  <Input type="date" value={action.startDate} onChange={(e) => updateAction(action.id, "startDate", e.target.value)} className="h-8" />
                </TableCell>
                <TableCell>
                  <Input type="date" value={action.endDate} onChange={(e) => updateAction(action.id, "endDate", e.target.value)} className="h-8" />
                </TableCell>
                <TableCell>
                  <Input value={action.leadMetric} onChange={(e) => updateAction(action.id, "leadMetric", e.target.value)} className="h-8" />
                </TableCell>
                <TableCell>
                  <Input value={action.baselineValue} onChange={(e) => updateAction(action.id, "baselineValue", e.target.value)} className="h-8 w-16 text-center" />
                </TableCell>
                <TableCell>
                  <Input value={action.targetValue} onChange={(e) => updateAction(action.id, "targetValue", e.target.value)} className="h-8 w-16 text-center" />
                </TableCell>
                <TableCell>
                  <Input value={action.contingency} onChange={(e) => updateAction(action.id, "contingency", e.target.value)} className="h-8" />
                </TableCell>
                <TableCell>
                  <select
                    value={action.status}
                    onChange={(e) => updateAction(action.id, "status", e.target.value)}
                    className="h-8 rounded-md border bg-background px-2 text-sm"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => removeAction(action.id)}>
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={addAction}>
          <Plus className="mr-2 size-4" />
          Agregar acción
        </Button>
        <Button variant="outline" onClick={handleGenerate} disabled={generating}>
          {generating ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
          {generating ? "Generando..." : "Generar plan con IA"}
        </Button>
        <AIPanel
          module="Plan de acción"
          actions={[{ type: "action_plan_suggestions", label: "Revisar plan" }]}
          contextBuilder={buildContext}
        />
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Guardando..." : "Guardar plan"}
        </Button>
      </div>
    </div>
  );
}

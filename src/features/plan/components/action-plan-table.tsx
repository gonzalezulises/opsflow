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
import { Plus, Trash2 } from "lucide-react";

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

const INITIAL_ACTIONS: ActionRow[] = [
  { id: "1", action: "Implementar checklist obligatorio de pedido", responsible: "Jefe Comercial", startDate: "", endDate: "", leadMetric: "% pedidos con error", baselineValue: "18", targetValue: "8", contingency: "Revisión por supervisor", status: "pending" },
  { id: "2", action: "Definir ventana diaria de liberación financiera", responsible: "Gerente de Crédito", startDate: "", endDate: "", leadMetric: "% pedidos en hold", baselineValue: "11", targetValue: "5", contingency: "Escalamiento automático", status: "pending" },
  { id: "3", action: "Implementar semáforo de materiales críticos", responsible: "Planificador", startDate: "", endDate: "", leadMetric: "Quiebres/mes", baselineValue: "4", targetValue: "1", contingency: "Proveedor alternativo local", status: "pending" },
  { id: "4", action: "Congelar cambios de prioridad después del corte", responsible: "Gerente de Operaciones", startDate: "", endDate: "", leadMetric: "% órdenes reprogramadas", baselineValue: "16", targetValue: "5", contingency: "Aprobación gerencial", status: "pending" },
  { id: "5", action: "Entrenar back-up de supervisor de picking", responsible: "Supervisor de Almacén", startDate: "", endDate: "", leadMetric: "% retrabajo picking", baselineValue: "9", targetValue: "4", contingency: "Soporte de turno anterior", status: "pending" },
];

export function ActionPlanTable({ caseId }: { caseId: string }) {
  const [actions, setActions] = useState<ActionRow[]>(INITIAL_ACTIONS);

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
      },
    ]);
  }

  function removeAction(id: string) {
    setActions((prev) => prev.filter((a) => a.id !== id));
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

      <div className="flex gap-2">
        <Button variant="outline" onClick={addAction}>
          <Plus className="mr-2 size-4" />
          Agregar acción
        </Button>
        <Button>Guardar plan</Button>
      </div>
    </div>
  );
}

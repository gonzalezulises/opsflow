"use client";

import { useTransition, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { updateCase } from "@/server/actions/cases";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface CaseData {
  id: string;
  name: string;
  companyName: string | null;
  sector: string | null;
  processFocus: string | null;
  currency: string;
  locale: string;
  status: string;
  metrics: unknown;
}

interface CaseContextFormProps {
  caseData: CaseData;
}

interface CustomMetric {
  id: string;
  name: string;
  value: string;
  unit: string;
  description: string;
}

interface MetricsShape {
  weeklyVolume?: number;
  avgTransactionValue?: number;
  contributionMargin?: number;
  serviceLevel?: number;
  leadTime?: number;
  customMetrics?: CustomMetric[];
  observations?: string;
  // Legacy fields for backward compatibility with seed data
  weeklyOrders?: number;
  avgTicket?: number;
  margin?: number;
  otdOtif?: number;
}

function parseMetrics(raw: unknown): MetricsShape {
  if (raw && typeof raw === "object") return raw as MetricsShape;
  return {};
}

function migrateMetrics(m: MetricsShape) {
  return {
    weeklyVolume: m.weeklyVolume ?? m.weeklyOrders,
    avgTransactionValue: m.avgTransactionValue ?? m.avgTicket,
    contributionMargin: m.contributionMargin ?? m.margin,
    serviceLevel: m.serviceLevel ?? m.otdOtif,
    leadTime: m.leadTime,
    customMetrics: m.customMetrics ?? [],
    observations: m.observations,
  };
}

export function CaseContextForm({ caseData }: CaseContextFormProps) {
  const [isPending, startTransition] = useTransition();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { dirty, markDirty, markClean } = useUnsavedChanges();

  const raw = parseMetrics(caseData.metrics);
  const metrics = migrateMetrics(raw);

  const [customMetrics, setCustomMetrics] = useState<CustomMetric[]>(
    metrics.customMetrics ?? []
  );

  function addCustomMetric() {
    setCustomMetrics((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", value: "", unit: "%", description: "" },
    ]);
    markDirty();
  }

  function updateCustomMetric(id: string, field: keyof CustomMetric, val: string) {
    setCustomMetrics((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: val } : m))
    );
    markDirty();
  }

  function removeCustomMetric(id: string) {
    setCustomMetrics((prev) => prev.filter((m) => m.id !== id));
    markDirty();
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveError(null);

    const form = new FormData(e.currentTarget);

    const updatedMetrics = {
      weeklyVolume: Number(form.get("weeklyVolume")) || undefined,
      avgTransactionValue: Number(form.get("avgTransactionValue")) || undefined,
      contributionMargin: Number(form.get("contributionMargin")) || undefined,
      serviceLevel: Number(form.get("serviceLevel")) || undefined,
      leadTime: Number(form.get("leadTime")) || undefined,
      customMetrics: customMetrics.filter((m) => m.name.trim() !== ""),
      observations: (form.get("observations") as string) || undefined,
    };

    startTransition(async () => {
      const result = await updateCase(caseData.id, {
        name: (form.get("name") as string) || caseData.name,
        companyName: (form.get("companyName") as string) || undefined,
        sector: (form.get("sector") as string) || undefined,
        processFocus: (form.get("processFocus") as string) || undefined,
        currency: (form.get("currency") as string) || undefined,
        locale: (form.get("locale") as string) || undefined,
        metrics: updatedMetrics,
      });
      if (result.error) {
        setSaveError(result.error);
        toast.error(result.error);
      } else {
        markClean();
        setLastSaved(new Date());
        toast.success("Contexto guardado");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} onChange={markDirty}>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Información general</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del caso</Label>
              <Input
                id="name"
                name="name"
                defaultValue={caseData.name}
                placeholder="Nombre del caso"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">Empresa</Label>
              <Input
                id="companyName"
                name="companyName"
                defaultValue={caseData.companyName ?? ""}
                placeholder="Nombre de la empresa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sector">Sector</Label>
              <Input
                id="sector"
                name="sector"
                defaultValue={caseData.sector ?? ""}
                placeholder="Ej: Manufactura, Servicios, Salud, Retail..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="processFocus">Proceso foco</Label>
              <Input
                id="processFocus"
                name="processFocus"
                defaultValue={caseData.processFocus ?? ""}
                placeholder="Ej: Pedido a despacho, Admisión a alta, Solicitud a resolución..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Moneda</Label>
                <Input
                  id="currency"
                  name="currency"
                  defaultValue={caseData.currency}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="locale">Localización</Label>
                <Input
                  id="locale"
                  name="locale"
                  defaultValue={caseData.locale}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Métricas universales</CardTitle>
            <p className="text-xs text-muted-foreground">
              <span className="text-destructive">*</span> Estas 5 métricas aplican a cualquier industria y alimentan los cálculos de desperdicio y seguimiento
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="weeklyVolume">
                Volumen semanal de transacciones <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                Cantidad promedio de transacciones por semana: pedidos, órdenes de trabajo, tickets, casos, consultas — según tu proceso.
              </p>
              <Input
                id="weeklyVolume"
                name="weeklyVolume"
                type="number"
                required
                defaultValue={metrics.weeklyVolume ?? ""}
                placeholder="210"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="avgTransactionValue">
                Valor promedio por transacción ({caseData.currency}) <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                Ingreso o valor económico promedio de cada transacción. Se usa para estimar el impacto monetario del desperdicio.
              </p>
              <Input
                id="avgTransactionValue"
                name="avgTransactionValue"
                type="number"
                required
                defaultValue={metrics.avgTransactionValue ?? ""}
                placeholder="480"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="contributionMargin">
                Margen de contribución (%) <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                Porcentaje del ingreso que queda después de costos variables. Es la base para calcular el margen perdido por cada problema operativo.
              </p>
              <Input
                id="contributionMargin"
                name="contributionMargin"
                type="number"
                required
                defaultValue={metrics.contributionMargin ?? ""}
                placeholder="22"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="serviceLevel">
                Nivel de servicio actual (%) <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                Porcentaje de cumplimiento al cliente: OTD/OTIF en logística, SLA en servicios, first-pass yield en manufactura, satisfacción en salud.
              </p>
              <Input
                id="serviceLevel"
                name="serviceLevel"
                type="number"
                required
                defaultValue={metrics.serviceLevel ?? ""}
                placeholder="62"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="leadTime">
                Lead time actual (días) <span className="text-destructive">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                Tiempo total de punta a punta del proceso foco. Desde que inicia la solicitud hasta que se entrega el resultado. El VSM lo descompone en detalle.
              </p>
              <Input
                id="leadTime"
                name="leadTime"
                type="number"
                step="0.1"
                required
                defaultValue={metrics.leadTime ?? ""}
                placeholder="6.8"
              />
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Métricas específicas del sector</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Agrega las métricas propias de tu industria o proceso. Ej: retrabajo picking, hold financiero, tasa de readmisión, tickets reabiertos, etc.
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addCustomMetric}>
                  <Plus className="mr-2 size-4" />
                  Agregar métrica
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {customMetrics.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Sin métricas específicas aún. Agrega las que sean relevantes para tu sector y proceso.
                  </p>
                  <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={addCustomMetric}>
                    <Plus className="mr-2 size-4" />
                    Agregar primera métrica
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {customMetrics.map((metric) => (
                    <div key={metric.id} className="rounded-lg border p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="grid flex-1 grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Nombre de la métrica</Label>
                            <Input
                              value={metric.name}
                              onChange={(e) => updateCustomMetric(metric.id, "name", e.target.value)}
                              placeholder="Ej: Retrabajo picking"
                              className="h-8"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Valor actual</Label>
                            <Input
                              value={metric.value}
                              onChange={(e) => updateCustomMetric(metric.id, "value", e.target.value)}
                              placeholder="Ej: 9"
                              className="h-8"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Unidad</Label>
                            <Input
                              value={metric.unit}
                              onChange={(e) => updateCustomMetric(metric.id, "unit", e.target.value)}
                              placeholder="%, horas, días..."
                              className="h-8"
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="mt-5 size-8"
                          onClick={() => removeCustomMetric(metric.id)}
                        >
                          <Trash2 className="size-4 text-muted-foreground" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Descripción (para el equipo)</Label>
                        <Input
                          value={metric.description}
                          onChange={(e) => updateCustomMetric(metric.id, "description", e.target.value)}
                          placeholder="Qué mide, por qué importa, cómo se obtiene"
                          className="h-8"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Observaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                name="observations"
                defaultValue={metrics.observations ?? ""}
                placeholder="Síntomas observados, restricciones conocidas, contexto relevante..."
                rows={4}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 lg:col-span-2">
          <div className="mr-auto flex items-center gap-2 text-sm">
            {saveError && (
              <span className="flex items-center gap-1 text-destructive">
                <Loader2 className="size-3.5" />
                {saveError}
              </span>
            )}
            {!saveError && lastSaved && !dirty && (
              <span className="flex items-center gap-1 text-emerald-600">
                Guardado
              </span>
            )}
            {dirty && !isPending && (
              <span className="font-medium text-amber-600">
                Cambios sin guardar
              </span>
            )}
          </div>
          <Button type="submit" disabled={isPending || (!dirty && !saveError)}>
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Guardar contexto
          </Button>
        </div>
      </div>
    </form>
  );
}

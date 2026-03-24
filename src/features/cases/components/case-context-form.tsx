"use client";

import { useTransition, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { updateCase } from "@/server/actions/cases";
import { Loader2, Check } from "lucide-react";

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

interface MetricsShape {
  weeklyOrders?: number;
  avgTicket?: number;
  margin?: number;
  otdOtif?: number;
  leadTime?: number;
  modifiedOrders?: number;
  correctedOrders?: number;
  financialHold?: number;
  reworkPicking?: number;
  microOutage?: number;
  observations?: string;
}

function parseMetrics(raw: unknown): MetricsShape {
  if (raw && typeof raw === "object") return raw as MetricsShape;
  return {};
}

export function CaseContextForm({ caseData }: CaseContextFormProps) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const metrics = parseMetrics(caseData.metrics);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaved(false);

    const form = new FormData(e.currentTarget);

    const updatedMetrics: MetricsShape = {
      weeklyOrders: Number(form.get("weeklyOrders")) || undefined,
      avgTicket: Number(form.get("avgTicket")) || undefined,
      margin: Number(form.get("margin")) || undefined,
      otdOtif: Number(form.get("otdOtif")) || undefined,
      leadTime: Number(form.get("leadTime")) || undefined,
      modifiedOrders: Number(form.get("modifiedOrders")) || undefined,
      correctedOrders: Number(form.get("correctedOrders")) || undefined,
      financialHold: Number(form.get("financialHold")) || undefined,
      reworkPicking: Number(form.get("reworkPicking")) || undefined,
      microOutage: Number(form.get("microOutage")) || undefined,
      observations: (form.get("observations") as string) || undefined,
    };

    startTransition(async () => {
      await updateCase(caseData.id, {
        name: (form.get("name") as string) || caseData.name,
        companyName: (form.get("companyName") as string) || undefined,
        sector: (form.get("sector") as string) || undefined,
        processFocus: (form.get("processFocus") as string) || undefined,
        currency: (form.get("currency") as string) || undefined,
        locale: (form.get("locale") as string) || undefined,
        metrics: updatedMetrics,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }

  return (
    <form onSubmit={handleSubmit}>
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
                placeholder="Ej: Alimentos y consumo masivo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="processFocus">Proceso foco</Label>
              <Input
                id="processFocus"
                name="processFocus"
                defaultValue={caseData.processFocus ?? ""}
                placeholder="Ej: Pedido a despacho"
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
            <CardTitle className="text-base">Métricas base</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weeklyOrders">Pedidos semanales</Label>
                <Input
                  id="weeklyOrders"
                  name="weeklyOrders"
                  type="number"
                  defaultValue={metrics.weeklyOrders ?? ""}
                  placeholder="210"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avgTicket">Ticket promedio (USD)</Label>
                <Input
                  id="avgTicket"
                  name="avgTicket"
                  type="number"
                  defaultValue={metrics.avgTicket ?? ""}
                  placeholder="480"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="margin">Margen de contribución (%)</Label>
                <Input
                  id="margin"
                  name="margin"
                  type="number"
                  defaultValue={metrics.margin ?? ""}
                  placeholder="22"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otdOtif">OTD/OTIF actual (%)</Label>
                <Input
                  id="otdOtif"
                  name="otdOtif"
                  type="number"
                  defaultValue={metrics.otdOtif ?? ""}
                  placeholder="62"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="leadTime">Lead time actual (días)</Label>
                <Input
                  id="leadTime"
                  name="leadTime"
                  type="number"
                  step="0.1"
                  defaultValue={metrics.leadTime ?? ""}
                  placeholder="6.8"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modifiedOrders">Órdenes modificadas (%)</Label>
                <Input
                  id="modifiedOrders"
                  name="modifiedOrders"
                  type="number"
                  defaultValue={metrics.modifiedOrders ?? ""}
                  placeholder="16"
                />
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="correctedOrders">Pedidos con corrección (%)</Label>
                <Input
                  id="correctedOrders"
                  name="correctedOrders"
                  type="number"
                  defaultValue={metrics.correctedOrders ?? ""}
                  placeholder="18"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="financialHold">Hold financiero (%)</Label>
                <Input
                  id="financialHold"
                  name="financialHold"
                  type="number"
                  defaultValue={metrics.financialHold ?? ""}
                  placeholder="11"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reworkPicking">Retrabajo picking (%)</Label>
                <Input
                  id="reworkPicking"
                  name="reworkPicking"
                  type="number"
                  defaultValue={metrics.reworkPicking ?? ""}
                  placeholder="9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="microOutage">Horas microcorte/mes</Label>
                <Input
                  id="microOutage"
                  name="microOutage"
                  type="number"
                  defaultValue={metrics.microOutage ?? ""}
                  placeholder="9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

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

        <div className="flex items-center justify-end gap-3 lg:col-span-2">
          {saved && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <Check className="size-4" />
              Guardado
            </span>
          )}
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Guardar contexto
          </Button>
        </div>
      </div>
    </form>
  );
}

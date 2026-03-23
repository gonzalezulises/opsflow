"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface CaseContextFormProps {
  caseId: string;
}

export function CaseContextForm({ caseId }: CaseContextFormProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información general</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Empresa</Label>
            <Input id="companyName" placeholder="Nombre de la empresa" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sector">Sector</Label>
            <Input id="sector" placeholder="Ej: Alimentos y consumo masivo" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="processFocus">Proceso foco</Label>
            <Input id="processFocus" placeholder="Ej: Pedido a despacho" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Moneda</Label>
              <Input id="currency" defaultValue="USD" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locale">Localización</Label>
              <Input id="locale" defaultValue="es-VE" />
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
              <Input id="weeklyOrders" type="number" placeholder="210" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="avgTicket">Ticket promedio (USD)</Label>
              <Input id="avgTicket" type="number" placeholder="480" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="margin">Margen de contribución (%)</Label>
              <Input id="margin" type="number" placeholder="22" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="otdOtif">OTD/OTIF actual (%)</Label>
              <Input id="otdOtif" type="number" placeholder="62" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="leadTime">Lead time actual (días)</Label>
              <Input id="leadTime" type="number" step="0.1" placeholder="6.8" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="modifiedOrders">Órdenes modificadas (%)</Label>
              <Input id="modifiedOrders" type="number" placeholder="16" />
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="correctedOrders">Pedidos con corrección (%)</Label>
              <Input id="correctedOrders" type="number" placeholder="18" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="financialHold">Hold financiero (%)</Label>
              <Input id="financialHold" type="number" placeholder="11" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reworkPicking">Retrabajo picking (%)</Label>
              <Input id="reworkPicking" type="number" placeholder="9" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="microOutage">Horas microcorte/mes</Label>
              <Input id="microOutage" type="number" placeholder="9" />
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
              placeholder="Síntomas observados, restricciones conocidas, contexto relevante..."
              rows={4}
            />
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end lg:col-span-2">
        <Button>Guardar contexto</Button>
      </div>
    </div>
  );
}

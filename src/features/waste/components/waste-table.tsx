"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { calculateWasteCost, type WasteInput } from "@/lib/calculations/waste";
import { saveAllWasteItems } from "@/server/actions/waste";
import { toast } from "sonner";

interface WasteRow extends WasteInput {
  id: string;
  problemDescription: string;
}

interface WasteItemFromDB {
  id: string;
  caseId: string;
  problemDescription: string;
  frequencyPerWeek: string | null;
  minutesLostPerEvent: string | null;
  hourlyLaborCost: string | null;
  unitsAffected: string | null;
  unitMargin: string | null;
  laborCostMonthly: string | null;
  marginLostMonthly: string | null;
  totalCostMonthly: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

function dbToRow(item: WasteItemFromDB): WasteRow {
  return {
    id: item.id,
    problemDescription: item.problemDescription,
    frequencyPerWeek: Number(item.frequencyPerWeek ?? 0),
    minutesLostPerEvent: Number(item.minutesLostPerEvent ?? 0),
    hourlyLaborCost: Number(item.hourlyLaborCost ?? 0),
    unitsAffected: Number(item.unitsAffected ?? 0),
    unitMargin: Number(item.unitMargin ?? 0),
  };
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("es-VE", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

interface WasteTableProps {
  caseId: string;
  initialItems: WasteItemFromDB[];
}

export function WasteTable({ caseId, initialItems }: WasteTableProps) {
  const [items, setItems] = useState<WasteRow[]>(
    initialItems.map(dbToRow),
  );
  const [saving, setSaving] = useState(false);

  function updateItem(id: string, field: keyof WasteRow, value: string | number) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        problemDescription: "",
        frequencyPerWeek: 0,
        minutesLostPerEvent: 0,
        hourlyLaborCost: 8,
        unitsAffected: 0,
        unitMargin: 0,
      },
    ]);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleSave() {
    setSaving(true);
    const payload = items.map((item) => ({
      caseId,
      problemDescription: item.problemDescription,
      frequencyPerWeek: item.frequencyPerWeek,
      minutesLostPerEvent: item.minutesLostPerEvent,
      hourlyLaborCost: item.hourlyLaborCost,
      unitsAffected: item.unitsAffected,
      unitMargin: item.unitMargin,
    }));

    const result = await saveAllWasteItems(caseId, payload);
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Costos guardados");
    }
  }

  const calculated = items.map((item) => {
    const costs = calculateWasteCost(item);
    return { ...item, ...costs };
  });

  const sorted = [...calculated].sort((a, b) => b.totalCostMonthly - a.totalCostMonthly);
  const totalMonthly = sorted.reduce((sum, i) => sum + i.totalCostMonthly, 0);
  const topWaste = sorted[0];

  const [showWasteTypes, setShowWasteTypes] = useState(true);

  return (
    <div className="space-y-6">
      {/* Tipos de desperdicio */}
      <Card className="border-primary/20 bg-primary/[0.02]">
        <CardHeader
          className="cursor-pointer select-none pb-3"
          onClick={() => setShowWasteTypes(!showWasteTypes)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Los 8 tipos de desperdicio (Muda) + Costo de no-calidad</CardTitle>
            <Button variant="ghost" size="icon" className="size-8">
              {showWasteTypes ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Taiichi Ohno (Toyota Production System) identificó 7 desperdicios; el 8vo fue agregado posteriormente. Úsalos como guía para identificar problemas en tu proceso.
          </p>
        </CardHeader>
        {showWasteTypes && (
          <CardContent className="grid gap-4 pt-0 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5 rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="text-xs">1</Badge>
                <p className="text-sm font-semibold">Defectos</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Productos o servicios que no cumplen especificaciones y requieren corrección, retrabajo o descarte.
                <span className="block mt-1 font-medium text-foreground">Ejemplo: pedidos con datos incorrectos, facturas con errores, picking equivocado.</span>
              </p>
            </div>

            <div className="space-y-1.5 rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="text-xs">2</Badge>
                <p className="text-sm font-semibold">Sobreproducción</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Producir más de lo que el cliente necesita o antes de que lo necesite. Genera inventario, obsolescencia y complejidad.
                <span className="block mt-1 font-medium text-foreground">Ejemplo: preparar pedidos que luego se cancelan, generar reportes que nadie lee.</span>
              </p>
            </div>

            <div className="space-y-1.5 rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Badge className="text-xs bg-amber-500">3</Badge>
                <p className="text-sm font-semibold">Esperas</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tiempo muerto entre pasos del proceso: aprobaciones pendientes, información que no llega, sistemas caídos.
                <span className="block mt-1 font-medium text-foreground">Ejemplo: pedidos en hold financiero, espera por liberación de crédito, cola en despacho.</span>
              </p>
            </div>

            <div className="space-y-1.5 rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Badge className="text-xs bg-amber-500">4</Badge>
                <p className="text-sm font-semibold">Transporte</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Movimiento innecesario de materiales, documentos o información entre ubicaciones o sistemas.
                <span className="block mt-1 font-medium text-foreground">Ejemplo: reenviar la misma información por correo, WhatsApp y ERP. Trasladar material entre almacenes.</span>
              </p>
            </div>

            <div className="space-y-1.5 rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">5</Badge>
                <p className="text-sm font-semibold">Inventario</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Acumulación excesiva de materiales, WIP o información sin procesar. Oculta problemas y consume capital.
                <span className="block mt-1 font-medium text-foreground">Ejemplo: pedidos acumulados sin despachar, stock de empaque que se deteriora, backlog de aprobaciones.</span>
              </p>
            </div>

            <div className="space-y-1.5 rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">6</Badge>
                <p className="text-sm font-semibold">Movimiento</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Movimiento innecesario de personas: buscar información, caminar entre áreas, cambiar entre sistemas.
                <span className="block mt-1 font-medium text-foreground">Ejemplo: operario buscando la hoja de picking, supervisor verificando manualmente cada despacho.</span>
              </p>
            </div>

            <div className="space-y-1.5 rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">7</Badge>
                <p className="text-sm font-semibold">Sobreprocesamiento</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Hacer más trabajo del que el cliente necesita: aprobaciones redundantes, controles duplicados, formatos excesivos.
                <span className="block mt-1 font-medium text-foreground">Ejemplo: triple validación de un pedido, imprimir documentos que ya están en el sistema.</span>
              </p>
            </div>

            <div className="space-y-1.5 rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">8</Badge>
                <p className="text-sm font-semibold">Talento no utilizado</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                No aprovechar las habilidades, conocimiento o creatividad de las personas. El 8vo desperdicio, agregado posteriormente.
                <span className="block mt-1 font-medium text-foreground">Ejemplo: operarios expertos haciendo tareas repetitivas que podrían automatizarse, ideas de mejora que nadie escucha.</span>
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Costo total mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(totalMonthly)}</p>
          </CardContent>
        </Card>
        {topWaste && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Principal fuga</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{topWaste.problemDescription}</p>
              <p className="text-sm text-muted-foreground">{formatCurrency(topWaste.totalCostMonthly)}/mes</p>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Problemas identificados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{items.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">#</TableHead>
              <TableHead className="min-w-[180px]">Problema</TableHead>
              <TableHead className="w-24 text-center">Frec./sem</TableHead>
              <TableHead className="w-24 text-center">Min/evento</TableHead>
              <TableHead className="w-24 text-center">$/hora</TableHead>
              <TableHead className="w-24 text-center">Unidades</TableHead>
              <TableHead className="w-24 text-center">Margen/u</TableHead>
              <TableHead className="w-28 text-right">Costo laboral</TableHead>
              <TableHead className="w-28 text-right">Margen perdido</TableHead>
              <TableHead className="w-28 text-right">Total mensual</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((item, idx) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Badge variant="outline">{idx + 1}</Badge>
                </TableCell>
                <TableCell>
                  <Input
                    value={item.problemDescription}
                    onChange={(e) => updateItem(item.id, "problemDescription", e.target.value)}
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <Input type="number" value={item.frequencyPerWeek} onChange={(e) => updateItem(item.id, "frequencyPerWeek", Number(e.target.value))} className="h-8 w-20 text-center" />
                </TableCell>
                <TableCell>
                  <Input type="number" value={item.minutesLostPerEvent} onChange={(e) => updateItem(item.id, "minutesLostPerEvent", Number(e.target.value))} className="h-8 w-20 text-center" />
                </TableCell>
                <TableCell>
                  <Input type="number" value={item.hourlyLaborCost} onChange={(e) => updateItem(item.id, "hourlyLaborCost", Number(e.target.value))} className="h-8 w-20 text-center" />
                </TableCell>
                <TableCell>
                  <Input type="number" value={item.unitsAffected ?? 0} onChange={(e) => updateItem(item.id, "unitsAffected", Number(e.target.value))} className="h-8 w-20 text-center" />
                </TableCell>
                <TableCell>
                  <Input type="number" value={item.unitMargin ?? 0} onChange={(e) => updateItem(item.id, "unitMargin", Number(e.target.value))} className="h-8 w-20 text-center" />
                </TableCell>
                <TableCell className="text-right text-sm">{formatCurrency(item.laborCostMonthly)}</TableCell>
                <TableCell className="text-right text-sm">{formatCurrency(item.marginLostMonthly)}</TableCell>
                <TableCell className="text-right font-medium">{formatCurrency(item.totalCostMonthly)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}>
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={addItem}>
          <Plus className="mr-2 size-4" />
          Agregar problema
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Guardando..." : "Guardar costos"}
        </Button>
      </div>
    </div>
  );
}

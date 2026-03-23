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
import { Plus, Trash2 } from "lucide-react";
import { calculateWasteCost, type WasteInput } from "@/lib/calculations/waste";

interface WasteRow extends WasteInput {
  id: string;
  problemDescription: string;
}

const INITIAL_WASTE: WasteRow[] = [
  { id: "1", problemDescription: "Corrección de pedidos", frequencyPerWeek: 38, minutesLostPerEvent: 25, hourlyLaborCost: 8, unitsAffected: 5, unitMargin: 105.6 },
  { id: "2", problemDescription: "Pedidos en hold financiero", frequencyPerWeek: 23, minutesLostPerEvent: 45, hourlyLaborCost: 10, unitsAffected: 3, unitMargin: 105.6 },
  { id: "3", problemDescription: "Re-trabajo de picking", frequencyPerWeek: 19, minutesLostPerEvent: 35, hourlyLaborCost: 7, unitsAffected: 2, unitMargin: 105.6 },
  { id: "4", problemDescription: "Quiebre de empaque", frequencyPerWeek: 4, minutesLostPerEvent: 120, hourlyLaborCost: 12, unitsAffected: 8, unitMargin: 105.6 },
];

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("es-VE", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function WasteTable({ caseId }: { caseId: string }) {
  const [items, setItems] = useState<WasteRow[]>(INITIAL_WASTE);

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

  const calculated = items.map((item) => {
    const costs = calculateWasteCost(item);
    return { ...item, ...costs };
  });

  const sorted = [...calculated].sort((a, b) => b.totalCostMonthly - a.totalCostMonthly);
  const totalMonthly = sorted.reduce((sum, i) => sum + i.totalCostMonthly, 0);
  const topWaste = sorted[0];

  return (
    <div className="space-y-6">
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
        <Button>Guardar costos</Button>
      </div>
    </div>
  );
}

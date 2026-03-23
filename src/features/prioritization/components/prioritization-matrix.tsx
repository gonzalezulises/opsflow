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
import {
  calculatePrioritizationScore,
  getClassificationColor,
  DEFAULT_WEIGHTS,
  type InitiativeScores,
  type PrioritizationWeights,
} from "@/lib/calculations/prioritization";

interface InitiativeRow extends InitiativeScores {
  id: string;
  name: string;
  description: string;
}

const INITIAL_INITIATIVES: InitiativeRow[] = [
  { id: "1", name: "Checklist obligatorio de pedido", description: "", impactLeadTime: 4, impactEconomic: 4, impactResilience: 3, feasibility30d: 5, effort: 2, externalDependency: 1 },
  { id: "2", name: "Ventana diaria de liberación financiera", description: "", impactLeadTime: 3, impactEconomic: 3, impactResilience: 3, feasibility30d: 4, effort: 2, externalDependency: 2 },
  { id: "3", name: "Semáforo de materiales críticos", description: "", impactLeadTime: 3, impactEconomic: 4, impactResilience: 5, feasibility30d: 3, effort: 3, externalDependency: 3 },
  { id: "4", name: "Congelar cambios de prioridad después del corte", description: "", impactLeadTime: 4, impactEconomic: 3, impactResilience: 4, feasibility30d: 4, effort: 2, externalDependency: 1 },
  { id: "5", name: "Back-up del supervisor de picking", description: "", impactLeadTime: 2, impactEconomic: 2, impactResilience: 5, feasibility30d: 4, effort: 3, externalDependency: 1 },
];

function classificationBadge(classification: string) {
  const variant = classification === "Atacar ya" ? "default" as const : classification === "Diseñar" ? "secondary" as const : "outline" as const;
  return <Badge variant={variant}>{classification}</Badge>;
}

export function PrioritizationMatrix({ caseId }: { caseId: string }) {
  const [initiatives, setInitiatives] = useState<InitiativeRow[]>(INITIAL_INITIATIVES);
  const [weights] = useState<PrioritizationWeights>(DEFAULT_WEIGHTS);

  function updateInitiative(id: string, field: keyof InitiativeRow, value: string | number) {
    setInitiatives((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  }

  function addInitiative() {
    setInitiatives((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: "",
        description: "",
        impactLeadTime: 3,
        impactEconomic: 3,
        impactResilience: 3,
        feasibility30d: 3,
        effort: 3,
        externalDependency: 3,
      },
    ]);
  }

  function removeInitiative(id: string) {
    setInitiatives((prev) => prev.filter((i) => i.id !== id));
  }

  const scored = initiatives
    .map((i) => {
      const result = calculatePrioritizationScore(i, weights);
      return { ...i, ...result };
    })
    .sort((a, b) => b.totalScore - a.totalScore);

  const attackCount = scored.filter((s) => s.classification === "Atacar ya").length;
  const designCount = scored.filter((s) => s.classification === "Diseñar").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Atacar ya</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{attackCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Diseñar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{designCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total iniciativas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{initiatives.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">#</TableHead>
              <TableHead className="min-w-[200px]">Iniciativa</TableHead>
              <TableHead className="w-20 text-center" title="Impacto en lead time">Lead T.</TableHead>
              <TableHead className="w-20 text-center" title="Impacto económico">Econ.</TableHead>
              <TableHead className="w-20 text-center" title="Impacto en resiliencia">Resil.</TableHead>
              <TableHead className="w-20 text-center" title="Factibilidad 30 días">Fact.</TableHead>
              <TableHead className="w-20 text-center" title="Esfuerzo (menor=mejor)">Esfuerzo</TableHead>
              <TableHead className="w-20 text-center" title="Dependencia externa (menor=mejor)">Dep. ext.</TableHead>
              <TableHead className="w-20 text-center">Score</TableHead>
              <TableHead className="w-28">Clasificación</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {scored.map((init, idx) => (
              <TableRow key={init.id}>
                <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                <TableCell>
                  <Input
                    value={init.name}
                    onChange={(e) => updateInitiative(init.id, "name", e.target.value)}
                    className="h-8"
                  />
                </TableCell>
                {(["impactLeadTime", "impactEconomic", "impactResilience", "feasibility30d", "effort", "externalDependency"] as const).map((field) => (
                  <TableCell key={field}>
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      value={init[field]}
                      onChange={(e) => updateInitiative(init.id, field, Number(e.target.value))}
                      className="h-8 w-16 text-center"
                    />
                  </TableCell>
                ))}
                <TableCell className="text-center font-semibold">{init.totalScore}</TableCell>
                <TableCell>{classificationBadge(init.classification)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => removeInitiative(init.id)}>
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={addInitiative}>
          <Plus className="mr-2 size-4" />
          Agregar iniciativa
        </Button>
        <Button>Guardar priorización</Button>
      </div>
    </div>
  );
}

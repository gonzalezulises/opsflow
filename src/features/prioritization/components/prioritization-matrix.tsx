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
import { Plus, Trash2, ChevronDown, ChevronUp, Sparkles, Loader2 } from "lucide-react";
import {
  calculatePrioritizationScore,
  DEFAULT_WEIGHTS,
  type InitiativeScores,
  type PrioritizationWeights,
} from "@/lib/calculations/prioritization";
import { saveAllInitiatives } from "@/server/actions/prioritization";
import { generateFromAI } from "@/server/actions/ai";
import { AIPanel } from "@/components/shared/ai-panel";
import { ScamperIdeasPanel, type ScamperInitiativeData } from "./scamper-ideas-panel";
import { SaveBar } from "@/components/shared/save-bar";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { toast } from "sonner";
import type { InitiativeGeneration } from "@/server/ai/schemas";

interface InitiativeRow extends InitiativeScores {
  id: string;
  name: string;
  description: string;
}

interface InitiativeFromDB {
  id: string;
  caseId: string;
  name: string;
  description: string | null;
  impactLeadTime: string | null;
  impactEconomic: string | null;
  impactResilience: string | null;
  feasibility30d: string | null;
  effort: string | null;
  externalDependency: string | null;
  totalScore: string | null;
  classification: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

function dbToRow(item: InitiativeFromDB): InitiativeRow {
  return {
    id: item.id,
    name: item.name,
    description: item.description ?? "",
    impactLeadTime: Number(item.impactLeadTime ?? 3),
    impactEconomic: Number(item.impactEconomic ?? 3),
    impactResilience: Number(item.impactResilience ?? 3),
    feasibility30d: Number(item.feasibility30d ?? 3),
    effort: Number(item.effort ?? 3),
    externalDependency: Number(item.externalDependency ?? 3),
  };
}

function classificationBadge(classification: string) {
  const variant = classification === "Atacar ya" ? "default" as const : classification === "Diseñar" ? "secondary" as const : "outline" as const;
  return <Badge variant={variant}>{classification}</Badge>;
}

interface PrioritizationMatrixProps {
  caseId: string;
  initialInitiatives: InitiativeFromDB[];
  initialWeights?: PrioritizationWeights;
  scamperContext?: string;
}

export function PrioritizationMatrix({
  caseId,
  initialInitiatives,
  initialWeights,
  scamperContext,
}: PrioritizationMatrixProps) {
  const [initiatives, setInitiatives] = useState<InitiativeRow[]>(
    initialInitiatives.map(dbToRow),
  );
  const [weights] = useState<PrioritizationWeights>(initialWeights ?? DEFAULT_WEIGHTS);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { dirty, markDirty, markClean } = useUnsavedChanges();

  function updateInitiative(id: string, field: keyof InitiativeRow, value: string | number) {
    setInitiatives((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
    markDirty();
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
    markDirty();
  }

  function addFromScamper(data: ScamperInitiativeData) {
    // Map SCAMPER impact/type to initiative scores
    const impactBase = data.estimatedImpact === "alto" ? 5 : data.estimatedImpact === "medio" ? 4 : 3;
    const scores = {
      impactLeadTime: data.improvementType === "tiempo" || data.improvementType === "flujo" ? impactBase : Math.max(impactBase - 1, 2),
      impactEconomic: data.improvementType === "costo" ? impactBase : Math.max(impactBase - 1, 2),
      impactResilience: data.improvementType === "calidad" ? impactBase : Math.max(impactBase - 2, 2),
      feasibility30d: 3,
      effort: 3,
      externalDependency: 2,
    };

    setInitiatives((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: data.name,
        description: `${data.description}\nPasos afectados: ${data.affectedSteps.join(", ")}`,
        ...scores,
      },
    ]);
    markDirty();
  }

  function removeInitiative(id: string) {
    setInitiatives((prev) => prev.filter((i) => i.id !== id));
    markDirty();
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    const payload = initiatives.map((i) => ({
      caseId,
      name: i.name,
      description: i.description,
      impactLeadTime: i.impactLeadTime,
      impactEconomic: i.impactEconomic,
      impactResilience: i.impactResilience,
      feasibility30d: i.feasibility30d,
      effort: i.effort,
      externalDependency: i.externalDependency,
    }));

    const result = await saveAllInitiatives(caseId, payload);
    setSaving(false);

    if (result.error) {
      setSaveError(result.error);
      toast.error(result.error);
    } else {
      markClean();
      setLastSaved(new Date());
      toast.success("Priorización guardada");
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    const result = await generateFromAI(caseId, "initiative_generation");
    setGenerating(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    const generated = result.data as InitiativeGeneration;
    if (generated?.initiatives) {
      const newInitiatives: InitiativeRow[] = generated.initiatives.map((init) => ({
        id: crypto.randomUUID(),
        name: init.name,
        description: init.description,
        impactLeadTime: init.impactLeadTime,
        impactEconomic: init.impactEconomic,
        impactResilience: init.impactResilience,
        feasibility30d: init.feasibility30d,
        effort: init.effort,
        externalDependency: init.externalDependency,
      }));
      setInitiatives((prev) => [...prev, ...newInitiatives]);
      markDirty();
      toast.success(`${newInitiatives.length} iniciativas generadas — revisa y ajusta antes de guardar`);
    }
  }

  function buildContext() {
    return initiatives.map((i, idx) => {
      const { totalScore, classification } = calculatePrioritizationScore(i, weights);
      return `${idx + 1}. ${i.name} — LeadT: ${i.impactLeadTime}, Econ: ${i.impactEconomic}, Resil: ${i.impactResilience}, Fact: ${i.feasibility30d}, Esf: ${i.effort}, Dep: ${i.externalDependency} → Score: ${totalScore} (${classification})`;
    }).join("\n");
  }

  const scored = initiatives
    .map((i) => {
      const result = calculatePrioritizationScore(i, weights);
      return { ...i, ...result };
    })
    .sort((a, b) => b.totalScore - a.totalScore);

  const attackCount = scored.filter((s) => s.classification === "Atacar ya").length;
  const designCount = scored.filter((s) => s.classification === "Diseñar").length;

  const [showCriteria, setShowCriteria] = useState(true);

  return (
    <div className="space-y-6">
      {/* Definición de criterios */}
      <Card className="border-primary/20 bg-primary/[0.02]">
        <CardHeader
          className="cursor-pointer select-none pb-3"
          onClick={() => setShowCriteria(!showCriteria)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Criterios de evaluación — ¿Qué significa cada columna?</CardTitle>
            <Button variant="ghost" size="icon" className="size-8">
              {showCriteria ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </Button>
          </div>
        </CardHeader>
        {showCriteria && (
          <CardContent className="grid gap-3 pt-0 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border p-3 space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="text-xs">25%</Badge>
                <p className="text-sm font-semibold">Impacto en Lead Time</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                ¿Cuánto reduce el tiempo total del proceso de punta a punta?
                <span className="block mt-1">1 = No lo afecta | 3 = Reduce algo | 5 = Reduce significativamente el lead time</span>
              </p>
            </div>

            <div className="rounded-lg border p-3 space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="text-xs">25%</Badge>
                <p className="text-sm font-semibold">Impacto Económico</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                ¿Cuánto dinero ahorra o genera? Conecta directamente con el módulo de costo del desperdicio.
                <span className="block mt-1">1 = Ahorro insignificante | 3 = Ahorro moderado | 5 = Elimina una fuga económica importante</span>
              </p>
            </div>

            <div className="rounded-lg border p-3 space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="text-xs">20%</Badge>
                <p className="text-sm font-semibold">Resiliencia</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                ¿Hace al proceso más resistente a fallas, imprevistos y variabilidad? Especialmente relevante en contextos con restricciones externas.
                <span className="block mt-1">1 = No mejora la resiliencia | 3 = Reduce un punto de vulnerabilidad | 5 = Elimina una dependencia crítica</span>
              </p>
            </div>

            <div className="rounded-lg border p-3 space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="text-xs">20%</Badge>
                <p className="text-sm font-semibold">Factibilidad a 30 días</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                ¿Se puede implementar en los próximos 30 días con los recursos actuales? Sin compras grandes, sin aprobaciones externas.
                <span className="block mt-1">1 = Imposible en 30 días | 3 = Factible con esfuerzo | 5 = Se puede hacer esta semana</span>
              </p>
            </div>

            <div className="rounded-lg border p-3 space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">5% inv.</Badge>
                <p className="text-sm font-semibold">Esfuerzo</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                ¿Cuánto trabajo requiere implementarla? <strong>Se invierte en la fórmula</strong>: menor esfuerzo = mejor score.
                <span className="block mt-1">1 = Muy poco esfuerzo (mejor) | 3 = Esfuerzo moderado | 5 = Requiere mucho trabajo (peor)</span>
              </p>
            </div>

            <div className="rounded-lg border p-3 space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">5% inv.</Badge>
                <p className="text-sm font-semibold">Dependencia externa</p>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                ¿Depende de personas, áreas o proveedores fuera de tu control? <strong>Se invierte en la fórmula</strong>: menor dependencia = mejor score.
                <span className="block mt-1">1 = No depende de nadie (mejor) | 3 = Necesita 1-2 aprobaciones | 5 = Depende de muchos actores (peor)</span>
              </p>
            </div>
          </CardContent>
        )}
      </Card>

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

      {scamperContext && (
        <ScamperIdeasPanel
          caseId={caseId}
          scamperContext={scamperContext}
          onConvertToInitiative={addFromScamper}
        />
      )}

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

      <SaveBar dirty={dirty} saving={saving} lastSaved={lastSaved} error={saveError} onSave={handleSave} label="Guardar priorización">
        <Button variant="outline" onClick={addInitiative}>
          <Plus className="mr-2 size-4" />
          Agregar iniciativa
        </Button>
        <Button variant="outline" onClick={handleGenerate} disabled={generating}>
          {generating ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
          {generating ? "Generando..." : "Generar iniciativas con IA"}
        </Button>
        <AIPanel
          caseId={caseId}
          module="Priorización"
          actions={[{ type: "prioritization_review", label: "Revisar priorización" }]}
          contextBuilder={buildContext}
        />
      </SaveBar>
    </div>
  );
}

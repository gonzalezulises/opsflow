"use client";

import { useState, useTransition } from "react";
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
import { calculateExposure, getRiskLevel, getRiskLevelLabel } from "@/lib/calculations/risk";
import { saveAllRiskItems } from "@/server/actions/risks";
import { generateFromAI } from "@/server/actions/ai";
import { AIPanel } from "@/components/shared/ai-panel";
import { SaveBar } from "@/components/shared/save-bar";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { toast } from "sonner";
import type { RiskGeneration } from "@/server/ai/schemas";

interface RiskRow {
  id: string;
  riskDescription: string;
  riskType: string;
  probability: number;
  impact: number;
  earlySignals: string;
  mitigations: string;
  additionalAction: string;
}

interface DBRiskItem {
  id: string;
  caseId: string;
  processStepId: string | null;
  riskDescription: string;
  riskType: string | null;
  probability: number;
  impact: number;
  exposure: string | null;
  earlySignals: string | null;
  mitigations: string | null;
  additionalAction: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
}

function dbToRow(item: DBRiskItem): RiskRow {
  return {
    id: item.id,
    riskDescription: item.riskDescription,
    riskType: item.riskType ?? "Otro",
    probability: item.probability,
    impact: item.impact,
    earlySignals: item.earlySignals ?? "",
    mitigations: item.mitigations ?? "",
    additionalAction: item.additionalAction ?? "",
  };
}

const RISK_TYPES = [
  "Disciplina comercial", "Gobierno", "Reposición", "Energía",
  "Talento", "Proveedor externo", "Tecnología", "Regulatorio", "Otro",
];

function exposureBadge(exposure: number) {
  const level = getRiskLevel(exposure);
  const label = getRiskLevelLabel(level);
  const variant = level === "critical" || level === "high" ? "destructive" as const : level === "medium" ? "secondary" as const : "outline" as const;
  return <Badge variant={variant}>{exposure} — {label}</Badge>;
}

export function RiskMatrix({ caseId, initialRisks }: { caseId: string; initialRisks: DBRiskItem[] }) {
  const [risks, setRisks] = useState<RiskRow[]>(
    initialRisks.length > 0 ? initialRisks.map(dbToRow) : [],
  );
  const [isPending, startTransition] = useTransition();
  const [generating, setGenerating] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { dirty, markDirty, markClean } = useUnsavedChanges();

  function updateRisk(id: string, field: keyof RiskRow, value: string | number) {
    setRisks((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
    markDirty();
  }

  function addRisk() {
    setRisks((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        riskDescription: "",
        riskType: "Otro",
        probability: 3,
        impact: 3,
        earlySignals: "",
        mitigations: "",
        additionalAction: "",
      },
    ]);
    markDirty();
  }

  function removeRisk(id: string) {
    setRisks((prev) => prev.filter((r) => r.id !== id));
    markDirty();
  }

  function handleSave() {
    setSaveError(null);
    startTransition(async () => {
      const dbItems = risks.map((r) => ({
        caseId,
        riskDescription: r.riskDescription,
        riskType: r.riskType,
        probability: r.probability,
        impact: r.impact,
        earlySignals: r.earlySignals,
        mitigations: r.mitigations,
        additionalAction: r.additionalAction,
      }));
      const result = await saveAllRiskItems(caseId, dbItems);
      if (result.error) {
        setSaveError(result.error);
        toast.error(result.error);
      } else {
        markClean();
        setLastSaved(new Date());
        toast.success("Riesgos guardados");
      }
    });
  }

  async function handleGenerate() {
    setGenerating(true);
    const result = await generateFromAI(caseId, "risk_generation");
    setGenerating(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    const generated = result.data as RiskGeneration;
    if (generated?.risks) {
      const newRisks: RiskRow[] = generated.risks.map((r) => ({
        id: crypto.randomUUID(),
        riskDescription: r.riskDescription,
        riskType: r.riskType,
        probability: r.probability,
        impact: r.impact,
        earlySignals: r.earlySignals,
        mitigations: r.mitigations,
        additionalAction: "",
      }));
      setRisks((prev) => [...prev, ...newRisks]);
      markDirty();
      toast.success(`${newRisks.length} riesgos generados — revisa y ajusta antes de guardar`);
    }
  }

  function buildContext() {
    return risks.map((r, i) =>
      `${i + 1}. [${r.riskType}] ${r.riskDescription} — Prob: ${r.probability}, Imp: ${r.impact}, Señales: ${r.earlySignals || "N/A"}, Mitigaciones: ${r.mitigations || "N/A"}`
    ).join("\n");
  }

  const sorted = [...risks]
    .map((r) => ({ ...r, exposure: calculateExposure(r.probability, r.impact) }))
    .sort((a, b) => {
      if (b.exposure !== a.exposure) return b.exposure - a.exposure;
      if (b.impact !== a.impact) return b.impact - a.impact;
      return b.probability - a.probability;
    });

  const topRisk = sorted[0];

  return (
    <div className="space-y-6">
      {topRisk && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Riesgo prioritario</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            {exposureBadge(topRisk.exposure)}
            <span className="font-medium">{topRisk.riskDescription}</span>
            <span className="text-sm text-muted-foreground">({topRisk.riskType})</span>
          </CardContent>
        </Card>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">#</TableHead>
              <TableHead className="min-w-[200px]">Riesgo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="w-20 text-center">Prob.</TableHead>
              <TableHead className="w-20 text-center">Impacto</TableHead>
              <TableHead className="w-28 text-center">Exposición</TableHead>
              <TableHead className="min-w-[150px]">Señales tempranas</TableHead>
              <TableHead className="min-w-[150px]">Mitigaciones</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((risk, idx) => (
              <TableRow key={risk.id}>
                <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                <TableCell>
                  <Input
                    value={risk.riskDescription}
                    onChange={(e) => updateRisk(risk.id, "riskDescription", e.target.value)}
                    className="h-8"
                  />
                </TableCell>
                <TableCell>
                  <select
                    value={risk.riskType}
                    onChange={(e) => updateRisk(risk.id, "riskType", e.target.value)}
                    className="h-8 rounded-md border bg-background px-2 text-sm"
                  >
                    {RISK_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={risk.probability}
                    onChange={(e) => updateRisk(risk.id, "probability", Number(e.target.value))}
                    className="h-8 w-16 text-center"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    value={risk.impact}
                    onChange={(e) => updateRisk(risk.id, "impact", Number(e.target.value))}
                    className="h-8 w-16 text-center"
                  />
                </TableCell>
                <TableCell className="text-center">
                  {exposureBadge(risk.exposure)}
                </TableCell>
                <TableCell>
                  <Textarea
                    value={risk.earlySignals}
                    onChange={(e) => updateRisk(risk.id, "earlySignals", e.target.value)}
                    rows={1}
                    className="min-h-8 resize-none text-sm"
                  />
                </TableCell>
                <TableCell>
                  <Textarea
                    value={risk.mitigations}
                    onChange={(e) => updateRisk(risk.id, "mitigations", e.target.value)}
                    rows={1}
                    className="min-h-8 resize-none text-sm"
                  />
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => removeRisk(risk.id)}>
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <SaveBar dirty={dirty} saving={isPending} lastSaved={lastSaved} error={saveError} onSave={handleSave} label="Guardar riesgos">
        <Button variant="outline" onClick={addRisk}>
          <Plus className="mr-2 size-4" />
          Agregar riesgo
        </Button>
        <Button variant="outline" onClick={handleGenerate} disabled={generating}>
          {generating ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
          {generating ? "Generando..." : "Generar riesgos con IA"}
        </Button>
        <AIPanel
          caseId={caseId}
          module="Riesgos"
          actions={[{ type: "risk_recommendations", label: "Analizar riesgos" }]}
          contextBuilder={buildContext}
        />
      </SaveBar>
    </div>
  );
}

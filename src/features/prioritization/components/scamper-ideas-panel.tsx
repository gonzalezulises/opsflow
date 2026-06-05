"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, Loader2, Lightbulb, ChevronUp, ArrowRight, EyeOff } from "lucide-react";
import { getAIInsight } from "@/server/actions/ai";
import type { ScamperIdeas } from "@/server/ai/schemas";
import { rankScamperIdeas, type RankedIdea } from "@/lib/calculations/scamper-rank";
import { toast } from "sonner";

const CATEGORIES = [
  { key: "Sustituir", color: "text-blue-600" },
  { key: "Combinar", color: "text-purple-600" },
  { key: "Adaptar", color: "text-amber-600" },
  { key: "Modificar", color: "text-orange-600" },
  { key: "Poner otro uso", color: "text-green-600" },
  { key: "Eliminar", color: "text-red-600" },
  { key: "Revertir", color: "text-indigo-600" },
] as const;

const IMPACT_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  alto: "default",
  medio: "secondary",
  bajo: "outline",
};

export interface ScamperInitiativeData {
  name: string;
  description: string;
  improvementType: "tiempo" | "costo" | "calidad" | "flujo";
  estimatedImpact: "alto" | "medio" | "bajo";
  affectedSteps: string[];
}

interface ScamperIdeasPanelProps {
  caseId: string;
  scamperContext: string;
  onConvertToInitiative: (data: ScamperInitiativeData) => void;
}

export function ScamperIdeasPanel({ caseId, scamperContext, onConvertToInitiative }: ScamperIdeasPanelProps) {
  const [ideas, setIdeas] = useState<RankedIdea[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [converted, setConverted] = useState<Set<number>>(new Set());
  const [showFiltered, setShowFiltered] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setOpen(true);
    const { data, error } = await getAIInsight("scamper_ideas", scamperContext, caseId);
    setLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    const result = data as ScamperIdeas;
    if (result?.ideas) {
      setIdeas(rankScamperIdeas(result.ideas));
      setConverted(new Set());
      setShowFiltered(false);
    }
  }

  function handleConvert(idea: ScamperIdeas["ideas"][0], index: number) {
    onConvertToInitiative({
      name: idea.title,
      description: `[SCAMPER/${idea.category}] ${idea.description}`,
      improvementType: idea.improvementType,
      estimatedImpact: idea.estimatedImpact,
      affectedSteps: idea.affectedSteps,
    });
    setConverted((prev) => new Set(prev).add(index));
    toast.success(`"${idea.title}" agregada como iniciativa`);
  }

  // Collapsed state — just a button
  if (!open) {
    return (
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleGenerate} disabled={loading}>
          {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Lightbulb className="mr-2 size-4" />}
          {loading ? "Generando ideas..." : "Ideas SCAMPER"}
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-bold">
            <Lightbulb className="size-4" />
            Ideas SCAMPER
            {ideas && <Badge variant="secondary" className="text-xs">{ideas.length} ideas</Badge>}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleGenerate} disabled={loading}>
              {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
              {ideas ? "Regenerar" : "Generar"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              <ChevronUp className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {loading && !ideas && (
        <CardContent className="flex items-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Analizando tu caso con SCAMPER...
        </CardContent>
      )}

      {ideas && (() => {
        const validIdeas = ideas.filter((i) => !i.filtered);
        const filteredIdeas = ideas.filter((i) => i.filtered);

        return (
          <CardContent className="space-y-4">
            {/* Ranked ideas by category */}
            <Tabs defaultValue={CATEGORIES.find((c) => validIdeas.some((i) => i.category === c.key))?.key ?? CATEGORIES[0].key}>
              <TabsList variant="line" className="w-full justify-start border-b pb-0 flex-wrap">
                {CATEGORIES.map((cat) => {
                  const count = validIdeas.filter((i) => i.category === cat.key).length;
                  if (count === 0) return null;
                  return (
                    <TabsTrigger key={cat.key} value={cat.key} className="gap-1 text-xs">
                      <span className={cat.color}>{cat.key}</span>
                      <Badge variant="outline" className="text-[10px] px-1">{count}</Badge>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {CATEGORIES.map((cat) => {
                const catIdeas = validIdeas.filter((i) => i.category === cat.key);
                if (catIdeas.length === 0) return null;
                return (
                  <TabsContent key={cat.key} value={cat.key} className="pt-3 space-y-2">
                    {catIdeas.map((idea, i) => {
                      const globalIdx = ideas.indexOf(idea);
                      const isConverted = converted.has(globalIdx);
                      return (
                        <div key={i} className="rounded-lg border p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 flex-1">
                              <p className="font-semibold text-sm">{idea.title}</p>
                              <p className="text-sm text-muted-foreground leading-relaxed">{idea.description}</p>
                            </div>
                            <div className="flex flex-col gap-1 shrink-0 items-end">
                              <div className="flex gap-1">
                                <Badge variant={IMPACT_VARIANT[idea.estimatedImpact]} className="text-xs">{idea.estimatedImpact}</Badge>
                                <Badge variant="outline" className="text-xs">{idea.improvementType}</Badge>
                              </div>
                              <Button
                                variant={isConverted ? "ghost" : "secondary"}
                                size="sm"
                                disabled={isConverted}
                                onClick={() => handleConvert(idea, globalIdx)}
                                className="text-xs"
                              >
                                {isConverted ? "Agregada" : (
                                  <>
                                    <ArrowRight className="mr-1 size-3" />
                                    Convertir en iniciativa
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                          {idea.affectedSteps.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {idea.affectedSteps.map((step, j) => (
                                <Badge key={j} variant="secondary" className="text-xs">{step}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </TabsContent>
                );
              })}
            </Tabs>

            {/* Filtered ideas */}
            {filteredIdeas.length > 0 && (
              <div className="pt-2 border-t">
                <button
                  onClick={() => setShowFiltered(!showFiltered)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <EyeOff className="size-3" />
                  {filteredIdeas.length} idea(s) filtrada(s)
                  {showFiltered ? " — ocultar" : " — mostrar"}
                </button>
                {showFiltered && (
                  <div className="mt-2 space-y-1.5">
                    {filteredIdeas.map((idea, i) => (
                      <div key={i} className="rounded-lg border border-dashed p-2.5 opacity-50">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium">{idea.title}</p>
                          <Badge variant="outline" className="text-[10px]">{idea.filterReason}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{idea.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        );
      })()}
    </Card>
  );
}

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, Loader2, Lightbulb, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { getAIInsight } from "@/server/actions/ai";
import type { ScamperIdeas } from "@/server/ai/schemas";
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

interface ScamperIdeasPanelProps {
  scamperContext: string;
  onConvertToInitiative: (name: string, description: string) => void;
}

export function ScamperIdeasPanel({ scamperContext, onConvertToInitiative }: ScamperIdeasPanelProps) {
  const [ideas, setIdeas] = useState<ScamperIdeas["ideas"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [converted, setConverted] = useState<Set<number>>(new Set());

  async function handleGenerate() {
    setLoading(true);
    setOpen(true);
    const { data, error } = await getAIInsight("scamper_ideas", scamperContext);
    setLoading(false);
    if (error) {
      toast.error(error);
      return;
    }
    const result = data as ScamperIdeas;
    if (result?.ideas) {
      setIdeas(result.ideas);
      setConverted(new Set());
    }
  }

  function handleConvert(idea: ScamperIdeas["ideas"][0], index: number) {
    onConvertToInitiative(
      idea.title,
      `[SCAMPER/${idea.category}] ${idea.description}`,
    );
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

      {ideas && (
        <CardContent>
          <Tabs defaultValue={CATEGORIES[0].key}>
            <TabsList variant="line" className="w-full justify-start border-b pb-0 flex-wrap">
              {CATEGORIES.map((cat) => {
                const count = ideas.filter((i) => i.category === cat.key).length;
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
              const catIdeas = ideas.filter((i) => i.category === cat.key);
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
        </CardContent>
      )}
    </Card>
  );
}

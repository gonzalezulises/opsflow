"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Lightbulb, ArrowRightLeft, Layers, Wrench, Recycle, Trash2, RotateCcw, Plus } from "lucide-react";
import { getAIInsight } from "@/server/actions/ai";
import type { ScamperIdeas } from "@/server/ai/schemas";
import { toast } from "sonner";

const CATEGORY_CONFIG: Record<string, { icon: typeof Lightbulb; color: string }> = {
  Sustituir: { icon: ArrowRightLeft, color: "text-blue-600 bg-blue-500/10 border-blue-500/20" },
  Combinar: { icon: Layers, color: "text-purple-600 bg-purple-500/10 border-purple-500/20" },
  Adaptar: { icon: Wrench, color: "text-amber-600 bg-amber-500/10 border-amber-500/20" },
  Modificar: { icon: Wrench, color: "text-orange-600 bg-orange-500/10 border-orange-500/20" },
  "Poner otro uso": { icon: Recycle, color: "text-green-600 bg-green-500/10 border-green-500/20" },
  Eliminar: { icon: Trash2, color: "text-red-600 bg-red-500/10 border-red-500/20" },
  Revertir: { icon: RotateCcw, color: "text-indigo-600 bg-indigo-500/10 border-indigo-500/20" },
};

const IMPACT_BADGE: Record<string, "default" | "secondary" | "outline"> = {
  alto: "default",
  medio: "secondary",
  bajo: "outline",
};

interface ScamperPanelProps {
  contextBuilder: () => string;
}

export function ScamperPanel({ contextBuilder }: ScamperPanelProps) {
  const [ideas, setIdeas] = useState<ScamperIdeas["ideas"] | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    const context = contextBuilder();
    const { data, error } = await getAIInsight("scamper_ideas", context);
    setLoading(false);

    if (error) {
      toast.error(error);
      return;
    }

    const result = data as ScamperIdeas;
    if (result?.ideas) {
      setIdeas(result.ideas);
    }
  }

  if (!ideas) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <Lightbulb className="size-8 text-muted-foreground mb-3" />
          <h3 className="font-bold text-lg mb-1">Generador SCAMPER</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-4">
            Genera ideas de mejora basadas en los datos reales de tu caso usando el método SCAMPER:
            Sustituir, Combinar, Adaptar, Modificar, Poner otro uso, Eliminar, Revertir.
          </p>
          <Button onClick={handleGenerate} disabled={loading}>
            {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
            {loading ? "Generando ideas..." : "Generar ideas SCAMPER"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Group by category
  const grouped = new Map<string, ScamperIdeas["ideas"]>();
  for (const idea of ideas) {
    const key = idea.category;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(idea);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Lightbulb className="size-5" />
          Ideas SCAMPER ({ideas.length})
        </h3>
        <Button variant="outline" size="sm" onClick={handleGenerate} disabled={loading}>
          {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Plus className="mr-2 size-4" />}
          Regenerar
        </Button>
      </div>

      {Array.from(grouped.entries()).map(([category, categoryIdeas]) => {
        const config = CATEGORY_CONFIG[category] ?? { icon: Lightbulb, color: "text-muted-foreground bg-muted" };
        const Icon = config.icon;

        return (
          <Card key={category} className={`border ${config.color.split(" ").slice(1).join(" ")}`}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-bold">
                <Icon className={`size-4 ${config.color.split(" ")[0]}`} />
                {category}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {categoryIdeas.map((idea, i) => (
                <div key={i} className="rounded-lg border bg-white p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm">{idea.title}</p>
                    <div className="flex gap-1 shrink-0">
                      <Badge variant={IMPACT_BADGE[idea.estimatedImpact]} className="text-xs">
                        {idea.estimatedImpact}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {idea.improvementType}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{idea.description}</p>
                  {idea.affectedSteps.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {idea.affectedSteps.map((step, j) => (
                        <Badge key={j} variant="secondary" className="text-xs">{step}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      <p className="text-xs text-muted-foreground italic text-center">
        Ideas generadas por IA basadas en los datos de tu caso. Evalúa factibilidad antes de implementar.
      </p>
    </div>
  );
}

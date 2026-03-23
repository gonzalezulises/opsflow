"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Loader2 } from "lucide-react";
import { getAIInsight, type AIActionType } from "@/server/actions/ai";

interface AIAction {
  type: AIActionType;
  label: string;
}

interface AIPanelProps {
  module: string;
  actions: AIAction[];
  contextBuilder: () => string;
}

export function AIPanel({ module, actions, contextBuilder }: AIPanelProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  async function handleAction(action: AIAction) {
    setLoading(true);
    setError(null);
    setResult(null);
    setActiveAction(action.label);

    const context = contextBuilder();
    const response = await getAIInsight(action.type, context);

    if (response.error) {
      setError(response.error);
    } else {
      setResult(response.data);
    }
    setLoading(false);
  }

  return (
    <Sheet>
      <SheetTrigger
        render={<Button variant="outline" size="sm" />}
      >
        <Sparkles className="mr-2 size-4" />
        Asistencia IA
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="size-4" />
            Asistencia IA — {module}
          </SheetTitle>
          <SheetDescription>
            La IA analiza tus datos y sugiere mejoras. No modifica datos automáticamente.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => (
              <Button
                key={action.type}
                variant="secondary"
                size="sm"
                disabled={loading}
                onClick={() => handleAction(action)}
              >
                {action.label}
              </Button>
            ))}
          </div>

          <Separator />

          <ScrollArea className="h-[calc(100vh-280px)]">
            {loading && (
              <div className="flex items-center gap-2 py-8 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Analizando datos...
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
                {error}
              </div>
            )}

            {result != null && !loading && (
              <div className="space-y-4">
                <Badge variant="outline">{activeAction}</Badge>
                <div className="space-y-3 text-sm">
                  {renderResult(result as Record<string, unknown>)}
                </div>
              </div>
            )}

            {!result && !loading && !error && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Selecciona una acción para obtener análisis de IA
              </p>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function renderResult(data: unknown): React.ReactNode | null {
  if (typeof data === "string") {
    return <p>{data}</p>;
  }

  if (Array.isArray(data)) {
    return (
      <ul className="space-y-1 pl-4">
        {data.map((item, i) => (
          <li key={i} className="list-disc">
            {typeof item === "object" ? renderResult(item) : String(item)}
          </li>
        ))}
      </ul>
    );
  }

  if (typeof data === "object" && data !== null) {
    return (
      <div className="space-y-3">
        {Object.entries(data as Record<string, unknown>).map(([key, value]) => (
          <div key={key}>
            <p className="font-medium capitalize">{formatKey(key)}</p>
            <div className="ml-2 text-muted-foreground">
              {renderResult(value)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <p>{String(data)}</p>;
}

function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase());
}

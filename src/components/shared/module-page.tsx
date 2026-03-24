"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ModuleGuide, type ModuleGuideContent } from "./module-guide";
import { BookOpen, Wrench, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModulePageProps {
  guide: ModuleGuideContent;
  children: React.ReactNode;
}

export function ModulePage({ guide, children }: ModulePageProps) {
  const [tab, setTab] = useState<"guide" | "exercise">("guide");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
        <button
          onClick={() => setTab("guide")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            tab === "guide"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <BookOpen className="size-4" />
          Guía del paso
        </button>
        <button
          onClick={() => setTab("exercise")}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
            tab === "exercise"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Wrench className="size-4" />
          Ejercicio
        </button>
      </div>

      {tab === "guide" ? (
        <div className="space-y-6">
          <ModuleGuide content={guide} defaultOpen />
          <div className="flex justify-center">
            <Button size="lg" onClick={() => setTab("exercise")}>
              Ir al ejercicio
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

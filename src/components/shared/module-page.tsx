"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ModuleGuide, type ModuleGuideContent } from "./module-guide";
import { CASE_MODULES } from "@/lib/constants/modules";
import { BookOpen, Wrench, ArrowRight, ArrowLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModulePageProps {
  guide: ModuleGuideContent;
  children: React.ReactNode;
}

export function ModulePage({ guide, children }: ModulePageProps) {
  const [tab, setTab] = useState<"guide" | "exercise">("guide");
  const router = useRouter();
  const params = useParams<{ caseId: string }>();
  const basePath = `/dashboard/cases/${params.caseId}`;

  const currentIndex = CASE_MODULES.findIndex((m) => m.order + 1 === guide.stepNumber);
  const prevModule = currentIndex > 0 ? CASE_MODULES[currentIndex - 1] : null;
  const nextModule = currentIndex < CASE_MODULES.length - 1 ? CASE_MODULES[currentIndex + 1] : null;

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
        <div className="space-y-8">
          {children}

          <div className="flex items-center justify-between border-t pt-6">
            {prevModule ? (
              <Button
                variant="outline"
                onClick={() => router.push(`${basePath}/${prevModule.path}`)}
              >
                <ArrowLeft className="mr-2 size-4" />
                {prevModule.shortLabel}
              </Button>
            ) : (
              <div />
            )}

            {nextModule ? (
              <Button onClick={() => router.push(`${basePath}/${nextModule.path}`)}>
                {nextModule.shortLabel}
                <ChevronRight className="ml-2 size-4" />
              </Button>
            ) : (
              <Button onClick={() => router.push("/dashboard/cases")}>
                Finalizar
                <ChevronRight className="ml-2 size-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

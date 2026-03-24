"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Target,
  Lightbulb,
  ListChecks,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export interface ModuleGuideContent {
  stepNumber: number;
  title: string;
  explanation: string;
  concept: string;
  objective: string;
  howTo: string[];
  risksToAvoid: string[];
  reference: {
    text: string;
    url?: string;
  };
}

export function ModuleGuide({ content }: { content: ModuleGuideContent }) {
  const [open, setOpen] = useState(true);

  return (
    <Card className="border-primary/20 bg-primary/[0.02]">
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge className="size-7 justify-center rounded-full text-xs">
              {content.stepNumber}
            </Badge>
            <CardTitle className="text-base">{content.title}</CardTitle>
          </div>
          <Button variant="ghost" size="icon" className="size-8">
            {open ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {open && (
        <CardContent className="grid gap-5 pt-0 md:grid-cols-2">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <BookOpen className="size-4 text-primary" />
              ¿Qué es esto?
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {content.explanation}
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Lightbulb className="size-4 text-primary" />
              Concepto clave
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {content.concept}
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Target className="size-4 text-primary" />
              Objetivo de este paso
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {content.objective}
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ListChecks className="size-4 text-primary" />
              Cómo se hace
            </div>
            <ol className="space-y-1 text-sm text-muted-foreground">
              {content.howTo.map((step, i) => (
                <li key={i} className="flex gap-2">
                  <span className="shrink-0 text-primary/60">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="size-4 text-destructive" />
              Riesgos a evitar
            </div>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {content.risksToAvoid.map((risk, i) => (
                <li key={i} className="flex gap-2">
                  <span className="shrink-0 text-destructive/60">•</span>
                  {risk}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ExternalLink className="size-4 text-primary" />
              Referencia clave
            </div>
            <p className="text-sm text-muted-foreground">
              {content.reference.url ? (
                <a
                  href={content.reference.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  {content.reference.text}
                </a>
              ) : (
                content.reference.text
              )}
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

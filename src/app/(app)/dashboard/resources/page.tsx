"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ExternalLink, BookOpen, Video, FileDown, Library, GraduationCap, Factory } from "lucide-react";
import { INDUSTRY_RESOURCES } from "@/lib/constants/industry-resources";

const BOOTCAMP_RESOURCES = [
  {
    category: "Lean & Value Stream Mapping",
    items: [
      {
        title: "Learning to See — Resumen ejecutivo",
        author: "Rother & Shook (Lean Enterprise Institute)",
        type: "Lectura",
        url: "https://www.lean.org/store/book/learning-to-see/",
        description: "El libro fundacional de Value Stream Mapping. Explica cómo mapear el estado actual y diseñar el estado futuro.",
      },
      {
        title: "Introduction to Value Stream Mapping — Jim Womack",
        author: "Lean Enterprise Institute",
        type: "Video",
        url: "https://www.youtube.com/watch?v=O--ZVqQvaA8",
        description: "Jim Womack (LEI) explica el propósito del VSM, su historia desde Ford hasta Toyota, y cómo usarlo.",
      },
      {
        title: "Los 8 desperdicios (Muda) en contextos de servicio",
        author: "Lean Enterprise Institute",
        type: "Lectura",
        url: "https://www.lean.org/lexicon-terms/muda-mura-muri/",
        description: "Los 8 tipos de desperdicio adaptados más allá de manufactura: esperas, transporte, sobreproducción, defectos, etc.",
      },
      {
        title: "Lean Thinking — Capítulo 1: Value",
        author: "Womack & Jones",
        type: "Lectura",
        url: "https://www.lean.org/lexicon-terms/lean-thinking/",
        description: "Fundamento de Lean: definir valor desde la perspectiva del cliente antes de optimizar.",
      },
    ],
  },
  {
    category: "Gestión de riesgos y calidad",
    items: [
      {
        title: "ISO 31000 Risk Management — Principles and Guidelines",
        author: "ISO",
        type: "Referencia",
        url: "https://www.iso.org/iso-31000-risk-management.html",
        description: "Marco internacional para identificar, evaluar y tratar riesgos. Base conceptual del módulo de riesgos.",
      },
      {
        title: "Cost of Quality (COQ) — ASQ",
        author: "American Society for Quality",
        type: "Guía",
        url: "https://asq.org/quality-resources/cost-of-quality",
        description: "Metodología para cuantificar cuánto cuesta la no-calidad: prevención, evaluación, fallas internas y externas.",
      },
      {
        title: "CMMI — Capability Maturity Model Integration",
        author: "CMMI Institute",
        type: "Marco",
        url: "https://cmmiinstitute.com/cmmi",
        description: "Modelo de madurez organizacional por niveles. Base conceptual del diagnóstico de madurez del bootcamp.",
      },
    ],
  },
  {
    category: "Mejora continua y gestión del cambio",
    items: [
      {
        title: "The PDSA Cycle — Deming Institute",
        author: "W. Edwards Deming",
        type: "Metodología",
        url: "https://deming.org/explore/pdsa/",
        description: "Plan-Do-Study-Act: el ciclo de mejora que fundamenta el plan de 30 días y el seguimiento semanal.",
      },
      {
        title: "Understanding Variation — D. Wheeler",
        author: "Donald J. Wheeler",
        type: "Libro",
        url: "https://www.spcpress.com/book_understanding_variation.php",
        description: "Cómo interpretar datos de proceso sin sobre-reaccionar. Clave para el seguimiento semanal.",
      },
      {
        title: "The Pyramid Principle — Barbara Minto",
        author: "Barbara Minto (McKinsey)",
        type: "Comunicación",
        url: "https://www.barbaraminto.com/",
        description: "Estructura de comunicación ejecutiva: conclusión primero, evidencia después. Para el reporte final.",
      },
    ],
  },
  {
    category: "Herramientas y plantillas",
    items: [
      {
        title: "ASQ Decision Matrix / Prioritization Matrix",
        author: "American Society for Quality",
        type: "Herramienta",
        url: "https://asq.org/quality-resources/decision-matrix",
        description: "Matriz de decisión ponderada. Base del módulo de priorización de iniciativas.",
      },
      {
        title: "Gemba Academy — VSM Templates",
        author: "Gemba Academy",
        type: "Plantillas",
        url: "https://www.gembaacademy.com/",
        description: "Recursos gratuitos de Lean: videos, plantillas y guías de implementación.",
      },
    ],
  },
];

function typeIcon(type: string) {
  switch (type) {
    case "Video": return <Video className="size-3.5" />;
    case "Herramienta":
    case "Plantillas": return <FileDown className="size-3.5" />;
    default: return <BookOpen className="size-3.5" />;
  }
}

function ResourceCard({ item }: { item: { title: string; author: string; type: string; url: string; description: string } }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-lg border p-3 transition-colors hover:bg-muted/50 hover:border-primary/30"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium group-hover:text-primary transition-colors">
              {item.title}
            </p>
            <ExternalLink className="size-3 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{item.author}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {item.description}
          </p>
        </div>
        <Badge variant="outline" className="shrink-0 gap-1 text-xs">
          {typeIcon(item.type)}
          {item.type}
        </Badge>
      </div>
    </a>
  );
}

export default function ResourcesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Recursos</h1>
        <p className="text-muted-foreground">
          Material de referencia para profundizar en cada tema del bootcamp
        </p>
      </div>

      <Tabs defaultValue="bootcamp">
        <TabsList variant="line" className="w-full justify-start border-b pb-0">
          <TabsTrigger value="bootcamp" className="gap-1.5">
            <GraduationCap className="size-4" />
            Bootcamp
          </TabsTrigger>
          <TabsTrigger value="industria" className="gap-1.5">
            <Factory className="size-4" />
            Por industria
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: Recursos del bootcamp ─── */}
        <TabsContent value="bootcamp" className="pt-6">
          <div className="space-y-8">
            {BOOTCAMP_RESOURCES.map((category) => (
              <section key={category.category}>
                <h3 className="mb-3 text-sm font-semibold text-primary">{category.category}</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {category.items.map((item) => (
                    <ResourceCard key={item.title} item={item} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </TabsContent>

        {/* ─── TAB 2: Recursos por industria ─── */}
        <TabsContent value="industria" className="pt-6">
          <Card className="mb-6 border-primary/20 bg-primary/[0.02]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Library className="size-4 text-primary" />
                ¿Cómo usar estos recursos?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground leading-relaxed space-y-2">
              <p>
                El caso base del bootcamp (Alimentos Santa Emilia — Pedido a Despacho) es un proceso
                universal: todas las industrias tienen un flujo equivalente con esperas, retrabajo
                y desperdicios similares.
              </p>
              <p>
                Cada sección incluye una <strong>analogía directa</strong> entre el caso base y tu
                industria, más recursos especializados para que profundices en las mejores prácticas
                de tu sector.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {INDUSTRY_RESOURCES.map((industry) => {
              const Icon = industry.icon;
              return (
                <Card key={industry.id} id={industry.id}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`flex size-10 items-center justify-center rounded-lg bg-muted ${industry.color}`}>
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <CardTitle>{industry.name}</CardTitle>
                        <CardDescription>{industry.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="rounded-lg border border-primary/20 bg-primary/[0.03] p-4">
                      <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                        Analogía con el caso base
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {industry.caseAnalogy}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {industry.resources.map((item) => (
                        <ResourceCard key={item.title} item={item} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

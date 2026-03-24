import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus, FileText, Users, BarChart3, ExternalLink, BookOpen, Video, FileDown } from "lucide-react";
import { getCases, getTemplates } from "@/server/actions/cases";
import { CASE_MODULES } from "@/lib/constants/modules";

const RESOURCES = [
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
        title: "Value Stream Mapping Explained in Under 10 Minutes",
        author: "Lean Enterprise Institute",
        type: "Video",
        url: "https://www.youtube.com/watch?v=SlMWCnDBhBo",
        description: "Introducción visual al VSM: qué es, por qué importa y cómo empezar.",
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
    case "Lectura":
    case "Libro":
    case "Guía":
    case "Referencia":
    case "Marco":
    case "Metodología":
    case "Comunicación": return <BookOpen className="size-3.5" />;
    case "Herramienta":
    case "Plantillas": return <FileDown className="size-3.5" />;
    default: return <ExternalLink className="size-3.5" />;
  }
}

export default async function DashboardPage() {
  const [casesResult, templatesResult] = await Promise.all([
    getCases(),
    getTemplates(),
  ]);

  const casesList = casesResult.data ?? [];
  const templatesList = templatesResult.data ?? [];

  const activeCases = casesList.filter((c) => c.status === "in_progress").length;
  const completedCases = casesList.filter((c) => c.status === "completed").length;
  const totalCases = casesList.length;

  // Use first non-template case for workflow links, fallback to template
  const workingCase = casesList[0] ?? templatesList[0];
  const caseBasePath = workingCase ? `/dashboard/cases/${workingCase.id}` : null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Gestiona tus casos de optimización operativa
          </p>
        </div>
        <Link href="/dashboard/cases/new">
          <Button>
            <Plus className="mr-2 size-4" />
            Nuevo caso
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Casos activos</CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCases}</div>
            <p className="text-xs text-muted-foreground">En progreso</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total casos</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCases}</div>
            <p className="text-xs text-muted-foreground">Creados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
            <BarChart3 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCases}</div>
            <p className="text-xs text-muted-foreground">Casos finalizados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plantillas</CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templatesList.length}</div>
            <p className="text-xs text-muted-foreground">Disponibles</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Inicio rápido</CardTitle>
            <CardDescription>
              Comienza con el caso base o crea uno nuevo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {templatesList.map((t) => (
              <Link key={t.id} href={`/dashboard/cases/new?template=${t.id}`} className="block">
                <div className="rounded-lg border p-4 transition-colors hover:bg-muted/50">
                  <h4 className="font-medium">{t.companyName ?? t.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t.sector ? `Sector ${t.sector.toLowerCase()}` : "Plantilla"} — {t.processFocus ?? "Proceso general"}
                  </p>
                </div>
              </Link>
            ))}
            <Link href="/dashboard/cases/new" className="block">
              <div className="rounded-lg border border-dashed p-4 transition-colors hover:bg-muted/50">
                <h4 className="font-medium">Caso en blanco</h4>
                <p className="text-sm text-muted-foreground">
                  Empieza desde cero con tu propio contexto
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Flujo de trabajo</CardTitle>
            <CardDescription>
              Haz clic en cada paso para ver la guía teórica
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-1">
              {CASE_MODULES.map((mod) => {
                const Icon = mod.icon;
                const href = caseBasePath
                  ? `${caseBasePath}/${mod.path}`
                  : `/dashboard/cases/new`;

                return (
                  <li key={mod.id}>
                    <Link
                      href={href}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-muted"
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {mod.order + 1}
                      </span>
                      <Icon className="size-4 text-muted-foreground" />
                      <span className="flex-1 font-medium">{mod.label}</span>
                      <ExternalLink className="size-3.5 text-muted-foreground" />
                    </Link>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* Recursos complementarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="size-5" />
            Recursos complementarios
          </CardTitle>
          <CardDescription>
            Material de libre acceso para profundizar en cada tema del bootcamp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-8 lg:grid-cols-2">
            {RESOURCES.map((category) => (
              <div key={category.category}>
                <h3 className="mb-3 text-sm font-semibold text-primary">{category.category}</h3>
                <div className="space-y-3">
                  {category.items.map((item) => (
                    <a
                      key={item.title}
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
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.description}</p>
                        </div>
                        <Badge variant="outline" className="shrink-0 gap-1 text-xs">
                          {typeIcon(item.type)}
                          {item.type}
                        </Badge>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

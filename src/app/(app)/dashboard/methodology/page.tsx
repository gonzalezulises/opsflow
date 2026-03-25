"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Workflow,
  Eye,
  Clock,
  BarChart3,
  Repeat,
  GitBranch,
  ClipboardCheck,
  ShieldAlert,
  DollarSign,
  ListOrdered,
  CalendarDays,
  Target,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Lightbulb,
  Layers,
} from "lucide-react";

const PRINCIPLES = [
  {
    icon: Workflow,
    title: "Todo es un proceso",
    description:
      "Cualquier actividad repetitiva — desde despachar un pedido hasta emitir una póliza — es un proceso. Y todo proceso se puede mapear, medir y mejorar. Si no lo puedes dibujar, no lo entiendes.",
  },
  {
    icon: Eye,
    title: "El valor lo define el cliente",
    description:
      "No la empresa, no el gerente, no el sistema. Valor es aquello por lo que el cliente estaría dispuesto a pagar. Todo lo demás es desperdicio — necesario o eliminable, pero no valor.",
  },
  {
    icon: Clock,
    title: "La mayor parte del tiempo es espera",
    description:
      "En la mayoría de los procesos, la eficiencia de flujo está entre 1% y 5%. Es decir, de cada 100 horas de lead time, solo 1-5 son trabajo real. El resto es espera, cola y handoffs.",
  },
  {
    icon: BarChart3,
    title: "Medir antes de mejorar",
    description:
      "Sin datos, todo es opinión. Antes de cambiar algo, necesitas una línea base medible. 'Somos lentos' no es un diagnóstico — 'nuestro lead time es 6.8 días cuando el cliente espera 3' sí lo es.",
  },
  {
    icon: Repeat,
    title: "Mejoras pequeñas y sostenidas",
    description:
      "Una transformación heroica de 6 meses tiene alta probabilidad de fracaso. Cinco mejoras concretas ejecutadas en 30 días generan momentum, aprendizaje y resultados medibles.",
  },
];

const MODELS = [
  {
    icon: Layers,
    name: "Lean Thinking",
    author: "Womack & Jones",
    role: "Filosofía base",
    description:
      "Define los 5 principios: identificar valor, mapear el flujo, crear flujo continuo, establecer pull, buscar la perfección. Es el lente con el que miramos todo.",
    usedIn: "Todo el bootcamp",
  },
  {
    icon: GitBranch,
    name: "Value Stream Mapping",
    author: "Rother & Shook",
    role: "Herramienta de diagnóstico",
    description:
      "Hace visible lo invisible: tiempos de espera, retrabajo, handoffs innecesarios. Separa el valor del desperdicio con datos, no con opiniones.",
    usedIn: "Módulo 3 — VSM",
  },
  {
    icon: ClipboardCheck,
    name: "Modelos de madurez (CMMI)",
    author: "CMMI Institute",
    role: "Evaluación del estado actual",
    description:
      "Mide la capacidad de la organización para ejecutar y mejorar procesos de forma sistemática. Nivel 1 (caótico) a nivel 5 (optimizado). No juzga — diagnostica.",
    usedIn: "Módulo 2 — Diagnóstico",
  },
  {
    icon: ShieldAlert,
    name: "ISO 31000",
    author: "ISO",
    role: "Gestión de riesgos",
    description:
      "Marco para identificar, evaluar y tratar riesgos. En Latam, los riesgos no son solo fallas internas — incluyen energía, reposición, talento y factores exógenos.",
    usedIn: "Módulo 4 — Riesgos",
  },
  {
    icon: DollarSign,
    name: "Cost of Quality (COPQ)",
    author: "ASQ",
    role: "Cuantificación económica",
    description:
      "Convierte problemas operativos en dinero: costo de corrección + margen perdido. El lenguaje universal para justificar mejoras ante la gerencia.",
    usedIn: "Módulo 5 — Desperdicio",
  },
  {
    icon: ListOrdered,
    name: "Matriz de decisión ponderada",
    author: "ASQ + Eisenhower",
    role: "Priorización objetiva",
    description:
      "Evalúa iniciativas en múltiples dimensiones (impacto, factibilidad, esfuerzo, dependencia) para evitar la trampa de atacar lo fácil o lo favorito.",
    usedIn: "Módulo 6 — Priorización",
  },
  {
    icon: CalendarDays,
    name: "PDCA / Ciclo de Deming",
    author: "Deming / Shewhart",
    role: "Motor de mejora continua",
    description:
      "Plan-Do-Check-Act: cada acción tiene una métrica, cada métrica se revisa, cada revisión genera ajuste. Sin este ciclo, las mejoras no sobreviven.",
    usedIn: "Módulos 7-8 — Plan y Seguimiento",
  },
];

const COMPARISONS = [
  {
    name: "Six Sigma / DMAIC",
    verdict: false,
    reason:
      "Requiere formación estadística avanzada (green/black belt), meses de recolección de datos y proyectos de 4-6 meses. Excelente para manufactura de alto volumen, pero demasiado pesado para un bootcamp de 6 horas y contextos con datos limitados.",
  },
  {
    name: "Reingeniería de procesos (BPR)",
    verdict: false,
    reason:
      "Propone rediseñar el proceso desde cero. Requiere inversión masiva, poder político para cambiar estructuras y tiene alta tasa de fracaso (~70%). No es viable para equipos que necesitan resultados en 30 días.",
  },
  {
    name: "Agile / Scrum",
    verdict: false,
    reason:
      "Diseñado para desarrollo de software, no para procesos operativos. Los sprints de 2 semanas asumen un equipo dedicado y un backlog de producto — no aplica a logística, despacho o emisión de pólizas.",
  },
  {
    name: "Kaizen puro",
    verdict: "parcial",
    reason:
      "La filosofía de mejora continua es correcta, pero sin VSM y cuantificación económica, los eventos Kaizen tienden a atacar síntomas sin ver el flujo completo. Incorporamos el espíritu Kaizen dentro de un marco más estructurado.",
  },
  {
    name: "Lean + VSM + Priorización + Plan 30d",
    verdict: true,
    reason:
      "Combina diagnóstico rápido, mapeo visual del proceso, cuantificación económica y plan accionable. Ejecutable en 6 horas de bootcamp. Genera entregables concretos desde la primera sesión. Contextualizable a cualquier industria y nivel de madurez.",
  },
];

function VerdictBadge({ verdict }: { verdict: boolean | string }) {
  if (verdict === true) {
    return (
      <Badge className="gap-1 bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/20">
        <CheckCircle2 className="size-3" />
        Nuestra elección
      </Badge>
    );
  }
  if (verdict === "parcial") {
    return (
      <Badge variant="outline" className="gap-1 text-amber-600 border-amber-500/30">
        <Lightbulb className="size-3" />
        Parcialmente
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 text-muted-foreground">
      <XCircle className="size-3" />
      No aplica
    </Badge>
  );
}

export default function MethodologyPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Badge variant="outline" className="mb-3">
          Fundamento teórico
        </Badge>
        <h1 className="text-2xl font-bold tracking-tight">
          Metodología del Bootcamp
        </h1>
        <p className="mt-1 text-muted-foreground max-w-2xl">
          Antes de tocar datos, es clave entender los principios, los modelos que usamos y por qué
          elegimos esta combinación sobre otras alternativas.
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="principios">
        <TabsList variant="line" className="w-full justify-start border-b pb-0">
          <TabsTrigger value="principios" className="gap-1.5">
            <Target className="size-4" />
            Principios
          </TabsTrigger>
          <TabsTrigger value="modelos" className="gap-1.5">
            <Layers className="size-4" />
            Modelos
          </TabsTrigger>
          <TabsTrigger value="justificacion" className="gap-1.5">
            <Lightbulb className="size-4" />
            Justificación
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: Principios ─── */}
        <TabsContent value="principios" className="pt-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold">5 principios de la optimización operativa</h2>
            <p className="text-sm text-muted-foreground">
              Las ideas fundamentales que guían todo el análisis
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PRINCIPLES.map((p, i) => {
              const Icon = p.icon;
              return (
                <Card key={i} className="relative overflow-hidden">
                  <div className="absolute top-3 right-3 text-4xl font-black text-muted/20">
                    {i + 1}
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-md bg-primary/10">
                        <Icon className="size-4 text-primary" />
                      </div>
                      <CardTitle className="text-base">{p.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {p.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ─── TAB 2: Modelos ─── */}
        <TabsContent value="modelos" className="pt-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold">7 modelos que usamos</h2>
            <p className="text-sm text-muted-foreground">
              Cada módulo del bootcamp se apoya en un modelo probado
            </p>
          </div>

          <div className="space-y-3">
            {MODELS.map((m, i) => {
              const Icon = m.icon;
              return (
                <Card key={i}>
                  <CardContent className="flex items-start gap-4 p-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">{m.name}</h3>
                        <span className="text-xs text-muted-foreground">— {m.author}</span>
                        <Badge variant="secondary" className="text-xs">
                          {m.role}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                        {m.description}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-xs hidden sm:flex">
                      {m.usedIn}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Flujo visual */}
          <Card className="mt-6 border-primary/20 bg-primary/[0.02]">
            <CardContent className="p-6">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-4">
                Cómo se conectan en el bootcamp
              </p>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="secondary" className="gap-1">
                  <ClipboardCheck className="size-3" />
                  Madurez (CMMI)
                </Badge>
                <ArrowRight className="size-3 text-muted-foreground" />
                <Badge variant="secondary" className="gap-1">
                  <GitBranch className="size-3" />
                  Mapeo (VSM)
                </Badge>
                <ArrowRight className="size-3 text-muted-foreground" />
                <Badge variant="secondary" className="gap-1">
                  <ShieldAlert className="size-3" />
                  Riesgos (ISO 31000)
                </Badge>
                <ArrowRight className="size-3 text-muted-foreground" />
                <Badge variant="secondary" className="gap-1">
                  <DollarSign className="size-3" />
                  Costo (COPQ)
                </Badge>
                <ArrowRight className="size-3 text-muted-foreground" />
                <Badge variant="secondary" className="gap-1">
                  <ListOrdered className="size-3" />
                  Priorizar (Matriz)
                </Badge>
                <ArrowRight className="size-3 text-muted-foreground" />
                <Badge variant="secondary" className="gap-1">
                  <CalendarDays className="size-3" />
                  Actuar (PDCA)
                </Badge>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Cada modelo alimenta al siguiente: el diagnóstico orienta el VSM, el VSM revela riesgos,
                los riesgos y el costo justifican la priorización, y la priorización genera el plan de acción.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── TAB 3: Justificación ─── */}
        <TabsContent value="justificacion" className="pt-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold">¿Por qué esta metodología y no otra?</h2>
            <p className="text-sm text-muted-foreground">
              Hay muchos marcos de mejora — pero no todos son viables en 6 horas con datos reales
            </p>
          </div>

          <div className="space-y-3">
            {COMPARISONS.map((c, i) => (
              <Card
                key={i}
                className={
                  c.verdict === true
                    ? "border-emerald-500/30 bg-emerald-500/[0.03]"
                    : ""
                }
              >
                <CardContent className="flex items-start gap-4 p-4">
                  <div className="pt-0.5">
                    <VerdictBadge verdict={c.verdict} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{c.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      {c.reason}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Resumen */}
          <Card className="mt-6 border-primary/20 bg-primary/[0.02]">
            <CardContent className="p-6 space-y-3">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                En resumen
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Elegimos esta combinación porque cumple 4 criterios que otras metodologías no logran simultáneamente:
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex gap-2 text-sm">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">Ejecutable en horas, no meses.</strong>{" "}
                    El equipo genera entregables desde la primera sesión.
                  </span>
                </div>
                <div className="flex gap-2 text-sm">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">Basada en datos reales.</strong>{" "}
                    No ejercicios académicos — cada participante trabaja con su proceso.
                  </span>
                </div>
                <div className="flex gap-2 text-sm">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">Contextualizada para Latam.</strong>{" "}
                    Incluye riesgos exógenos (energía, reposición, talento) que otros marcos ignoran.
                  </span>
                </div>
                <div className="flex gap-2 text-sm">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">Genera un plan de 30 días.</strong>{" "}
                    El entregable final es accionable, medible y con contingencias.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardCheck,
  GitBranch,
  CalendarDays,
  ArrowRight,
  Clock,
  Monitor,
  Users,
  Target,
  Zap,
  BookOpen,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0a1628] text-white">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_30%,#1a3a8a_50%,#2b5dea_70%,#4a8fe6_90%)]" />
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-[#2b5dea]/20 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-[#4a8fe6]/10 blur-2xl" />
        <div className="relative mx-auto max-w-5xl px-6 py-20 sm:py-28">
          <div className="flex items-center gap-4 mb-6">
            <Image src="/iesa-60-logo.png" alt="IESA 60" width={360} height={126} className="h-28 w-auto" />
            <Badge variant="secondary" className="bg-white/15 text-white border-white/20 hover:bg-white/20">
              25 y 26 de marzo 2026
            </Badge>
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl leading-[1.1]">
            Bootcamp de
            <br />
            Optimización Operativa
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-white/80 leading-relaxed">
            Diagnóstico, Mapeo de Flujo de Valor y Plan de Acción.
            <br />
            Una intervención técnica donde cada participante trabaja sobre su propio proceso real.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="bg-white text-[oklch(0.22_0.08_250)] hover:bg-white/90 font-semibold">
                Entrar al bootcamp
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Clock className="size-4" />
              6 horas académicas
            </div>
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Monitor className="size-4" />
              Virtual sincrónica
            </div>
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Users className="size-4" />
              Trabajo en equipos
            </div>
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Zap className="size-4" />
              Asistencia IA
            </div>
          </div>
        </div>
      </section>

      {/* Facilitador */}
      <section className="border-b bg-white/60">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
              UG
            </div>
            <div>
              <a href="https://www.linkedin.com/in/ulisesgonzalez/?locale=es_ES" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">Prof. Ulises González</a>
              <p className="text-sm text-muted-foreground">Facilitador — Excelencia operativa, Lean y mejora continua</p>
            </div>
          </div>
        </div>
      </section>

      {/* Introducción */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight">¿De qué se trata?</h2>
          <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Este bootcamp no es un curso teórico. Es una <strong className="text-foreground">intervención técnica</strong> donde
              cada participante analiza un proceso real de su empresa, identifica las fuentes de fricción
              y construye un plan de mejora ejecutable en 30 días.
            </p>
            <p>
              Usamos un enfoque práctico basado en <strong className="text-foreground">Lean Thinking</strong> y
              <strong className="text-foreground"> Value Stream Mapping</strong>, contextualizado para las restricciones
              reales de operar en Latinoamérica: energía, reposición, transporte, talento y coordinación informal.
            </p>
            <p>
              La plataforma OpsFlow guía cada paso del proceso con teoría, ejercicios prácticos
              y asistencia de inteligencia artificial que analiza tus datos con pensamiento crítico.
            </p>
          </div>
        </div>
      </section>

      {/* Agenda */}
      <section className="bg-white/60 border-y">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-2xl font-bold tracking-tight">Agenda</h2>
          <p className="mt-2 text-muted-foreground">2 sesiones, 6 horas académicas, 100% práctico</p>

          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            {/* Sesión 1 */}
            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <Badge className="mb-2">Sesión 1</Badge>
                  <h3 className="text-lg font-semibold">Diagnóstico y fundamentos de VSM</h3>
                  <p className="text-sm text-muted-foreground">Martes 25 de marzo — 6:00 a 8:30 PM</p>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <ClipboardCheck className="size-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Bloque 1: Diagnóstico de fricción</p>
                      <p className="text-xs text-muted-foreground">75 min — Identificar y priorizar los puntos de fricción que bloquean la entrega de valor</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <GitBranch className="size-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Bloque 2: Value Stream Mapping (parte 1)</p>
                      <p className="text-xs text-muted-foreground">75 min — Mapear el proceso actual con tiempos, esperas y retrabajo</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sesión 2 */}
            <Card>
              <CardContent className="p-6 space-y-6">
                <div>
                  <Badge className="mb-2">Sesión 2</Badge>
                  <h3 className="text-lg font-semibold">VSM avanzado y plan de acción</h3>
                  <p className="text-sm text-muted-foreground">Miércoles 26 de marzo — 6:00 a 8:30 PM</p>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <GitBranch className="size-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Bloque 2: VSM (parte 2) + Análisis</p>
                      <p className="text-xs text-muted-foreground">60 min — Riesgos contextuales, costo del desperdicio y priorización</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <CalendarDays className="size-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Bloque 3: Plan de acción 30 días</p>
                      <p className="text-xs text-muted-foreground">60 min — Convertir hallazgos en acciones medibles con responsables y contingencias</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Target className="size-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Cierre y compromisos</p>
                      <p className="text-xs text-muted-foreground">30 min — Reporte ejecutivo, peer review y compromisos de seguimiento</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Qué vas a lograr */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-2xl font-bold tracking-tight">¿Qué vas a lograr?</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <div className="space-y-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <ClipboardCheck className="size-5 text-primary" />
            </div>
            <h3 className="font-semibold">Diagnóstico real</h3>
            <p className="text-sm text-muted-foreground">
              Un diagnóstico de madurez operativa de tu proceso con hallazgos críticos y focos de mejora.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <GitBranch className="size-5 text-primary" />
            </div>
            <h3 className="font-semibold">Mapa de flujo de valor</h3>
            <p className="text-sm text-muted-foreground">
              Un VSM completo con lead time, eficiencia de flujo, cuellos de botella y oportunidades quick win.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <CalendarDays className="size-5 text-primary" />
            </div>
            <h3 className="font-semibold">Plan de 30 días</h3>
            <p className="text-sm text-muted-foreground">
              Un plan accionable con responsables, métricas, metas y contingencias listo para ejecutar.
            </p>
          </div>
        </div>
      </section>

      {/* Pre-work */}
      <section className="bg-white/60 border-y">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <BookOpen className="size-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Pre-work</h2>
              <p className="mt-1 text-sm text-muted-foreground">Completa antes de la primera sesión (25 min estimados)</p>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><span className="text-primary">1.</span> Formulario de contexto operativo (tu proceso, métricas base)</li>
                <li className="flex gap-2"><span className="text-primary">2.</span> Lectura: Introducción a Value Stream Mapping (15 min)</li>
                <li className="flex gap-2"><span className="text-primary">3.</span> Lectura: Los 8 desperdicios en contextos de servicio (10 min)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 py-16 text-center">
        <h2 className="text-2xl font-bold">¿Listo para empezar?</h2>
        <p className="mt-2 text-muted-foreground">Entra a la plataforma y comienza con tu caso</p>
        <div className="mt-6">
          <Link href="/dashboard">
            <Button size="lg">
              Entrar al bootcamp
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/60 py-6 text-center text-sm text-muted-foreground">
        <p>Desarrollo exclusivo para el Bootcamp IESA por <a href="https://www.linkedin.com/in/ulisesgonzalez/?locale=es_ES" target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground hover:underline">Ulises González</a> — 2026</p>
        <p className="mt-1 text-xs">OpsFlow — Optimización operativa inteligente</p>
      </footer>
    </div>
  );
}

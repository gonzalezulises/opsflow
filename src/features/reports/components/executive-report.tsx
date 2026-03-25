"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AIPanel } from "@/components/shared/ai-panel";
import {
  AlertTriangle,
  TrendingDown,
  DollarSign,
  Zap,
  ClipboardCheck,
  GitBranch,
  ShieldAlert,
  ListOrdered,
  CalendarDays,
  BarChart3,
} from "lucide-react";
import type { MaturityLevel } from "@/lib/calculations/diagnostic";

export interface ReportData {
  case: {
    companyName: string;
    sector: string;
    processFocus: string;
    currency: string;
  };
  diagnostic: {
    average: number;
    level: MaturityLevel;
    respondedCount: number;
  } | null;
  vsm: {
    leadTimeHours: number;
    leadTimeDays: number;
    flowEfficiency: number;
    totalProcessTimeMinutes: number;
    totalWaitTimeHours: number;
    avgRework: number;
    stepsCount: number;
  } | null;
  bottleneck: {
    stepName: string;
    department: string | null;
    waitTimeHours: number;
    reworkPercentage: number;
  } | null;
  topRisk: {
    description: string;
    type: string;
    probability: number;
    impact: number;
    exposure: number;
  } | null;
  risksCount: number;
  criticalRiskCount: number;
  topWaste: {
    problem: string;
    totalCostMonthly: number;
  } | null;
  totalWasteCost: number;
  wasteCount: number;
  attackNow: { name: string; score: number }[];
  initiativesCount: number;
  plan: {
    totalActions: number;
    completedActions: number;
    blockedActions: number;
    progressPct: number;
  };
  lastWeek: {
    weekNumber: number;
    leadTime: number | null;
    otdOtif: number | null;
    planProgress: number | null;
  } | null;
}

function levelBadge(level: MaturityLevel) {
  const variants: Record<MaturityLevel, "destructive" | "secondary" | "default"> = {
    bajo: "destructive",
    medio: "secondary",
    alto: "default",
  };
  const labels: Record<MaturityLevel, string> = {
    bajo: "Bajo",
    medio: "Medio",
    alto: "Alto",
  };
  return <Badge variant={variants[level]}>{labels[level]}</Badge>;
}

function fmt(n: number, decimals = 2) {
  return n.toFixed(decimals);
}

function fmtMoney(n: number, currency: string) {
  return new Intl.NumberFormat("es", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

function EmptyState({ label }: { label: string }) {
  return (
    <p className="text-sm text-muted-foreground italic">
      Sin datos — completa el módulo de {label}
    </p>
  );
}

export function ExecutiveReport({ caseId, data }: { caseId: string; data: ReportData }) {
  const { currency } = data.case;

  function buildContext() {
    const parts: string[] = [
      `Empresa: ${data.case.companyName}, Sector: ${data.case.sector}, Proceso: ${data.case.processFocus}`,
    ];
    if (data.diagnostic) {
      parts.push(`Diagnóstico: ${data.diagnostic.average}/5 (${data.diagnostic.level}), ${data.diagnostic.respondedCount} respuestas`);
    }
    if (data.vsm) {
      parts.push(`VSM: Lead time ${fmt(data.vsm.leadTimeHours)}h (${fmt(data.vsm.leadTimeDays)} días), Eficiencia: ${fmt(data.vsm.flowEfficiency)}%, Retrabajo: ${fmt(data.vsm.avgRework)}%`);
    }
    if (data.bottleneck) {
      parts.push(`Cuello de botella: ${data.bottleneck.stepName} (${data.bottleneck.department ?? "?"}) — ${data.bottleneck.waitTimeHours}h espera`);
    }
    if (data.topRisk) {
      parts.push(`Riesgo prioritario: ${data.topRisk.description} (${data.topRisk.type}) — Exposición: ${data.topRisk.exposure}`);
    }
    parts.push(`Riesgos: ${data.risksCount} total, ${data.criticalRiskCount} críticos/altos`);
    if (data.topWaste) {
      parts.push(`Principal fuga: ${data.topWaste.problem} — ${fmtMoney(data.topWaste.totalCostMonthly, currency)}/mes`);
    }
    parts.push(`Costo total desperdicios: ${fmtMoney(data.totalWasteCost, currency)}/mes`);
    if (data.attackNow.length > 0) {
      parts.push(`Quick wins: ${data.attackNow.map((i) => `${i.name} (${fmt(i.score)})`).join(", ")}`);
    }
    parts.push(`Plan: ${data.plan.totalActions} acciones, ${data.plan.completedActions} completadas (${data.plan.progressPct}%)`);
    if (data.lastWeek) {
      parts.push(`Última semana (S${data.lastWeek.weekNumber}): Lead time ${data.lastWeek.leadTime ?? "N/A"}h, OTD ${data.lastWeek.otdOtif ?? "N/A"}%`);
    }
    return parts.join("\n");
  }

  const moduleCount = [data.diagnostic, data.vsm, data.topRisk, data.topWaste, data.initiativesCount > 0, data.plan.totalActions > 0].filter(Boolean).length;

  return (
    <div className="space-y-6" id="executive-report">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Resumen ejecutivo</h3>
          <p className="text-sm text-muted-foreground">{moduleCount} de 6 módulos completados</p>
        </div>
        <AIPanel
          module="Reporte ejecutivo"
          actions={[{ type: "executive_report", label: "Generar narrativa IA" }]}
          contextBuilder={buildContext}
        />
      </div>

      {/* Caso + Diagnóstico */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardCheck className="size-4 text-primary" />
              Caso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Empresa</span>
              <span className="font-medium">{data.case.companyName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sector</span>
              <span>{data.case.sector}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Proceso</span>
              <span>{data.case.processFocus}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardCheck className="size-4 text-primary" />
              Nivel de madurez
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.diagnostic ? (
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold">{fmt(data.diagnostic.average)}</div>
                <div>
                  {levelBadge(data.diagnostic.level)}
                  <p className="mt-1 text-sm text-muted-foreground">
                    Promedio de {data.diagnostic.respondedCount} preguntas
                  </p>
                </div>
              </div>
            ) : (
              <EmptyState label="Diagnóstico" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* VSM + Bottleneck */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <GitBranch className="size-4 text-primary" />
              Flujo de valor (VSM)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.vsm ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Lead time</p>
                    <p className="font-semibold">{fmt(data.vsm.leadTimeHours)}h ({fmt(data.vsm.leadTimeDays)} días)</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Eficiencia de flujo</p>
                    <p className="font-semibold">{fmt(data.vsm.flowEfficiency)}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tiempo de proceso</p>
                    <p className="font-semibold">{fmt(data.vsm.totalProcessTimeMinutes, 0)} min</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tiempo de espera</p>
                    <p className="font-semibold">{fmt(data.vsm.totalWaitTimeHours)}h</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">{data.vsm.stepsCount} pasos</Badge>
                  <Badge variant="outline">Retrabajo prom: {fmt(data.vsm.avgRework)}%</Badge>
                </div>
              </div>
            ) : (
              <EmptyState label="VSM" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown className="size-4 text-destructive" />
              Cuello de botella principal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.bottleneck ? (
              <div className="space-y-2">
                <p className="font-medium">{data.bottleneck.stepName}</p>
                <p className="text-sm text-muted-foreground">
                  {data.bottleneck.department ?? "Sin departamento"} — {data.bottleneck.waitTimeHours}h de espera, {fmt(data.bottleneck.reworkPercentage)}% retrabajo
                </p>
              </div>
            ) : (
              <EmptyState label="VSM" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Riesgo + Desperdicio */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="size-4 text-destructive" />
              Riesgo prioritario
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topRisk ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">Exposición: {data.topRisk.exposure}</Badge>
                  <span className="font-medium">{data.topRisk.description}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Tipo: {data.topRisk.type} | Prob: {data.topRisk.probability} | Imp: {data.topRisk.impact}
                </p>
                <p className="text-sm text-muted-foreground">
                  {data.risksCount} riesgos totales, {data.criticalRiskCount} críticos/altos
                </p>
              </div>
            ) : (
              <EmptyState label="Riesgos" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="size-4 text-destructive" />
              Principal fuga económica
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.topWaste ? (
              <div className="space-y-2">
                <p className="font-medium">{data.topWaste.problem}</p>
                <p className="text-2xl font-bold">{fmtMoney(data.topWaste.totalCostMonthly, currency)}/mes</p>
                <p className="text-sm text-muted-foreground">
                  Costo total de {data.wasteCount} fugas: {fmtMoney(data.totalWasteCost, currency)}/mes
                </p>
              </div>
            ) : (
              <EmptyState label="Desperdicio" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Iniciativas quick win */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="size-4 text-primary" />
            Quick wins — Atacar ya
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.attackNow.length > 0 ? (
            <div className="space-y-2">
              <ul className="space-y-2 text-sm">
                {data.attackNow.map((init, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Badge>Score {fmt(init.score)}</Badge>
                    {init.name}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-muted-foreground">
                {data.initiativesCount} iniciativas totales, {data.attackNow.length} clasificadas como &quot;Atacar ya&quot;
              </p>
            </div>
          ) : data.initiativesCount > 0 ? (
            <p className="text-sm text-muted-foreground">
              {data.initiativesCount} iniciativas registradas, ninguna clasificada como &quot;Atacar ya&quot;
            </p>
          ) : (
            <EmptyState label="Priorización" />
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Plan + Tracking */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="size-4 text-primary" />
            Plan de 30 días — resumen
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.plan.totalActions > 0 ? (
            <div className="grid gap-4 sm:grid-cols-4 text-center">
              <div>
                <p className="text-2xl font-bold">{data.plan.totalActions}</p>
                <p className="text-sm text-muted-foreground">Acciones totales</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{data.plan.completedActions}</p>
                <p className="text-sm text-muted-foreground">Completadas</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{data.plan.progressPct}%</p>
                <p className="text-sm text-muted-foreground">Avance</p>
              </div>
              <div>
                {data.plan.blockedActions > 0 ? (
                  <div className="flex items-center justify-center gap-1">
                    <AlertTriangle className="size-4 text-destructive" />
                    <p className="text-2xl font-bold text-destructive">{data.plan.blockedActions}</p>
                  </div>
                ) : (
                  <p className="text-2xl font-bold">0</p>
                )}
                <p className="text-sm text-muted-foreground">Bloqueadas</p>
              </div>
            </div>
          ) : (
            <EmptyState label="Plan de acción" />
          )}
        </CardContent>
      </Card>

      {data.lastWeek && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="size-4 text-primary" />
              Última semana registrada (S{data.lastWeek.weekNumber})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3 text-center">
              {data.lastWeek.leadTime != null && (
                <div>
                  <p className="text-2xl font-bold">{fmt(data.lastWeek.leadTime)}h</p>
                  <p className="text-sm text-muted-foreground">Lead time</p>
                </div>
              )}
              {data.lastWeek.otdOtif != null && (
                <div>
                  <p className="text-2xl font-bold">{fmt(data.lastWeek.otdOtif)}%</p>
                  <p className="text-sm text-muted-foreground">OTD/OTIF</p>
                </div>
              )}
              {data.lastWeek.planProgress != null && (
                <div>
                  <p className="text-2xl font-bold">{fmt(data.lastWeek.planProgress)}%</p>
                  <p className="text-sm text-muted-foreground">Avance del plan</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

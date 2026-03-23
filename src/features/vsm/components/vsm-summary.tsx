"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import type { VSMResult } from "@/lib/calculations/vsm";

interface VSMSummaryProps {
  result: VSMResult;
}

function getEfficiencyVariant(efficiency: number) {
  if (efficiency >= 25) return "default" as const;
  if (efficiency >= 10) return "secondary" as const;
  return "destructive" as const;
}

function getEfficiencyLabel(efficiency: number) {
  if (efficiency >= 25) return "Buena";
  if (efficiency >= 10) return "Moderada";
  return "Baja";
}

export function VSMSummary({ result }: VSMSummaryProps) {
  const efficiencyVariant = getEfficiencyVariant(result.flowEfficiency);
  const efficiencyLabel = getEfficiencyLabel(result.flowEfficiency);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Lead time total
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums">
            {result.leadTimeHours} h
          </p>
          <p className="text-xs text-muted-foreground">
            {result.leadTimeDays} dias
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Tiempo de proceso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums">
            {result.totalProcessTimeMinutes} min
          </p>
          <p className="text-xs text-muted-foreground">
            {result.totalProcessTimeHours} h
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Tiempo de valor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums">
            {result.valueAddTimeMinutes} min
          </p>
          <p className="text-xs text-muted-foreground">
            {result.valueAddTimeHours} h
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Tiempo de espera
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums">
            {result.totalWaitTimeHours} h
          </p>
        </CardContent>
      </Card>

      <Card className="sm:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Eficiencia de flujo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold tabular-nums">
              {result.flowEfficiency}%
            </span>
            <Badge variant={efficiencyVariant}>{efficiencyLabel}</Badge>
          </div>
          <Progress value={result.flowEfficiency}>
            <ProgressLabel>Eficiencia</ProgressLabel>
            <ProgressValue />
          </Progress>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Pasos del proceso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums">
            {result.stepsCount}
          </p>
          <p className="text-xs text-muted-foreground">
            {result.valueAddStepsCount} agregan valor &middot;{" "}
            {result.stepsCount - result.valueAddStepsCount} no agregan valor
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Retrabajo promedio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold tabular-nums">
            {result.avgRework}%
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

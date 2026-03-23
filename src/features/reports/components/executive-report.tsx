"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileDown } from "lucide-react";

export function ExecutiveReport({ caseId }: { caseId: string }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Resumen ejecutivo</h3>
        <Button variant="outline">
          <FileDown className="mr-2 size-4" />
          Exportar PDF
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Caso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Empresa</span>
              <span className="font-medium">Alimentos Santa Emilia, C.A.</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sector</span>
              <span>Alimentos y consumo masivo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Proceso</span>
              <span>Pedido a despacho</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nivel de madurez</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <div className="text-3xl font-bold">2.67</div>
            <div>
              <Badge variant="secondary">Medio</Badge>
              <p className="mt-1 text-sm text-muted-foreground">Promedio de 15 preguntas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cuello de botella principal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium">Producción / picking</p>
            <p className="text-sm text-muted-foreground">
              18h de espera, 9% retrabajo — mayor tiempo de espera del flujo
            </p>
            <div className="flex gap-2 text-sm">
              <Badge variant="outline">Lead time: 56.53h (2.36 días)</Badge>
              <Badge variant="outline">Eficiencia: 2.56%</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Riesgo prioritario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="destructive">Exposición: 20</Badge>
              <span className="font-medium">Quiebre de empaque importado</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Tipo: Reposición | Probabilidad: 4 | Impacto: 5
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Principal fuga económica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium">Corrección de pedidos</p>
            <p className="text-2xl font-bold">$2,841/mes</p>
            <p className="text-sm text-muted-foreground">
              Costo total mensual estimado de todas las fugas: ~$8,500
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick wins identificados</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Badge>Atacar ya</Badge>
                Checklist obligatorio de pedido
              </li>
              <li className="flex items-center gap-2">
                <Badge>Atacar ya</Badge>
                Congelar cambios de prioridad después del corte
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Plan de 30 días — resumen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4 text-center">
            <div>
              <p className="text-2xl font-bold">5</p>
              <p className="text-sm text-muted-foreground">Acciones totales</p>
            </div>
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-sm text-muted-foreground">Completadas</p>
            </div>
            <div>
              <p className="text-2xl font-bold">0%</p>
              <p className="text-sm text-muted-foreground">Avance</p>
            </div>
            <div>
              <p className="text-2xl font-bold">S2</p>
              <p className="text-sm text-muted-foreground">Última semana registrada</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

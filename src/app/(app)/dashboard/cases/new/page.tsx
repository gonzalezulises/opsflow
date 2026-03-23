import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, Copy } from "lucide-react";

export default function NewCasePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo caso</h1>
        <p className="text-muted-foreground">
          Elige cómo empezar tu análisis de optimización operativa
        </p>
      </div>

      <div className="grid gap-4">
        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Copy className="size-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Desde caso base</CardTitle>
                <CardDescription>
                  Alimentos Santa Emilia — Pedido a Despacho
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Usa el caso base del toolkit con datos pre-cargados: 6 pasos VSM,
              6 riesgos, 4 problemas de desperdicio y 5 iniciativas.
              Ideal para bootcamps y workshops.
            </p>
            <div className="mt-4">
              <Link href="/dashboard/cases/template-base/context">
                <Button>Usar caso base</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <FileText className="size-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">Caso en blanco</CardTitle>
                <CardDescription>
                  Empieza desde cero con tu propio contexto
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Define empresa, sector, proceso y métricas base manualmente.
              Agrega pasos, riesgos e iniciativas a tu ritmo.
            </p>
            <div className="mt-4">
              <Link href="/dashboard/cases/new-blank/context">
                <Button variant="outline">Crear en blanco</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Copy } from "lucide-react";
import { getTemplates } from "@/server/actions/cases";
import { CreateFromTemplateButton } from "@/features/cases/components/create-from-template-button";
import { CreateBlankButton } from "@/features/cases/components/create-blank-button";

export default async function NewCasePage() {
  const templatesResult = await getTemplates();
  const templates = templatesResult.data ?? [];
  const baseTemplate = templates[0];

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nuevo caso</h1>
        <p className="text-muted-foreground">
          Elige cómo empezar tu análisis de optimización operativa
        </p>
      </div>

      <div className="grid gap-4">
        {baseTemplate && (
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <Copy className="size-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">Desde caso base</CardTitle>
                  <CardDescription>
                    {baseTemplate.companyName ?? baseTemplate.name} — {baseTemplate.processFocus ?? "Proceso general"}
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
                <CreateFromTemplateButton
                  templateId={baseTemplate.id}
                  templateName={baseTemplate.name}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="transition-colors hover:bg-muted/50">
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
              <CreateBlankButton />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

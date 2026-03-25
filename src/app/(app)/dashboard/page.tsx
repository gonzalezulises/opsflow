import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus, FileText, Users, BarChart3, ExternalLink } from "lucide-react";
import { getCases, getTemplates } from "@/server/actions/cases";
import { CASE_MODULES } from "@/lib/constants/modules";

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

    </div>
  );
}

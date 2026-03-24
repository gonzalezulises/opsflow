import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getCases, getTemplates } from "@/server/actions/cases";

function statusBadge(status: string) {
  switch (status) {
    case "draft":
      return <Badge variant="secondary">Borrador</Badge>;
    case "in_progress":
      return <Badge variant="default">En progreso</Badge>;
    case "completed":
      return <Badge variant="outline">Completado</Badge>;
    default:
      return null;
  }
}

export default async function CasesPage() {
  const [casesResult, templatesResult] = await Promise.all([
    getCases(),
    getTemplates(),
  ]);

  const casesList = casesResult.data ?? [];
  const templatesList = templatesResult.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Casos</h1>
          <p className="text-muted-foreground">
            Gestiona tus casos y plantillas de optimización
          </p>
        </div>
        <Link href="/dashboard/cases/new">
          <Button>
            <Plus className="mr-2 size-4" />
            Nuevo caso
          </Button>
        </Link>
      </div>

      {templatesList.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Plantillas</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templatesList.map((c) => (
              <Link key={c.id} href={`/dashboard/cases/${c.id}/context`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{c.name}</CardTitle>
                      <Badge variant="outline">Plantilla</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">{c.companyName}</p>
                    <div className="flex items-center gap-2">
                      {c.sector && <Badge variant="secondary">{c.sector}</Badge>}
                      {statusBadge(c.status)}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold">Mis casos</h2>
        {casesList.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="mb-4 text-muted-foreground">
                Aún no tienes casos. Crea uno nuevo para comenzar.
              </p>
              <Link href="/dashboard/cases/new">
                <Button>
                  <Plus className="mr-2 size-4" />
                  Nuevo caso
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {casesList.map((c) => (
              <Link key={c.id} href={`/dashboard/cases/${c.id}/context`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-base">{c.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">{c.companyName ?? "Sin empresa"}</p>
                    <div className="flex items-center gap-2">
                      {c.sector && <Badge variant="secondary">{c.sector}</Badge>}
                      {statusBadge(c.status)}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

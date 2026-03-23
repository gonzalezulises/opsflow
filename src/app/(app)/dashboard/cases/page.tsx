import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Plus } from "lucide-react";

// TODO: Replace with real data from server action
const MOCK_CASES = [
  {
    id: "template-base",
    name: "Alimentos Santa Emilia — Pedido a Despacho",
    companyName: "Alimentos Santa Emilia, C.A.",
    sector: "Alimentos y consumo masivo",
    status: "completed" as const,
    isTemplate: true,
  },
];

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

export default function CasesPage() {
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_CASES.map((c) => (
          <Link key={c.id} href={`/dashboard/cases/${c.id}`}>
            <Card className="transition-colors hover:bg-muted/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{c.name}</CardTitle>
                  {c.isTemplate && <Badge variant="outline">Plantilla</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">{c.companyName}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{c.sector}</Badge>
                  {statusBadge(c.status)}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

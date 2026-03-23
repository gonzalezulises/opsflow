import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users } from "lucide-react";

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Equipo</h1>
          <p className="text-muted-foreground">
            Gestiona usuarios, cohortes y equipos de trabajo
          </p>
        </div>
        <Button>
          <Plus className="mr-2 size-4" />
          Invitar usuario
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Miembros</CardTitle>
          <CardDescription>Usuarios con acceso a la organización</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                  A
                </div>
                <div>
                  <p className="text-sm font-medium">admin@opsflow.com</p>
                  <p className="text-xs text-muted-foreground">Administrador</p>
                </div>
              </div>
              <Badge>Admin</Badge>
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Users className="mr-1 inline size-4" />
            Conecta Supabase Auth para gestionar usuarios reales
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdminEmail } from "@/server/auth/platform";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email?.toLowerCase() ?? "";
  const showPlatform = email && isPlatformAdminEmail(email);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">
          Ajustes de la organización y preferencias
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Miembros y organizaciones</CardTitle>
          <CardDescription>
            Ver miembros de la organización activa y cambiar de organización si
            tienes varias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button render={<Link href="/dashboard/settings/members" />}>
            Abrir
          </Button>
        </CardContent>
      </Card>

      {showPlatform ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Multi-tenant (plataforma)</CardTitle>
            <CardDescription>
              Crear una organización nueva (tenant) para un cliente o unidad de
              negocio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button render={<Link href="/organization/new" />}>
              Nueva organización
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organización</CardTitle>
          <CardDescription>Datos generales de tu organización</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orgName">Nombre</Label>
            <Input id="orgName" defaultValue="OpsFlow Demo" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="orgSlug">Slug</Label>
            <Input id="orgSlug" defaultValue="opsflow-demo" disabled />
          </div>
          <Button>Guardar</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pesos de priorización</CardTitle>
          <CardDescription>
            Configura los pesos por defecto para la matriz de priorización de iniciativas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Impacto en lead time</Label>
              <Input type="number" step="0.05" defaultValue="0.25" />
            </div>
            <div className="space-y-2">
              <Label>Impacto económico</Label>
              <Input type="number" step="0.05" defaultValue="0.25" />
            </div>
            <div className="space-y-2">
              <Label>Impacto en resiliencia</Label>
              <Input type="number" step="0.05" defaultValue="0.20" />
            </div>
            <div className="space-y-2">
              <Label>Factibilidad 30 días</Label>
              <Input type="number" step="0.05" defaultValue="0.20" />
            </div>
            <div className="space-y-2">
              <Label>Esfuerzo (invertido)</Label>
              <Input type="number" step="0.05" defaultValue="0.05" />
            </div>
            <div className="space-y-2">
              <Label>Dependencia ext. (invertido)</Label>
              <Input type="number" step="0.05" defaultValue="0.05" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Los pesos deben sumar 1.00. Se aplican a nuevos casos.
          </p>
          <Button>Guardar pesos</Button>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Modo de cálculo VSM</CardTitle>
          <CardDescription>
            Selecciona el modo predeterminado para nuevos casos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-4">
            <div className="rounded-lg border p-3 ring-2 ring-primary">
              <p className="font-medium">Lean correcto</p>
              <p className="text-xs text-muted-foreground">
                Tiempo de valor = solo pasos que agregan valor
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="font-medium">Compatibilidad Excel</p>
              <p className="text-xs text-muted-foreground">
                Tiempo de valor = todos los tiempos de proceso
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

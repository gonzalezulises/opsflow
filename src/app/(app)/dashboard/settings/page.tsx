import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdminEmail } from "@/server/auth/platform";
import { getOrganizationSettingsPayload } from "@/server/actions/organization-settings";
import {
  submitOrganizationPreferencesForm,
  submitOrganizationProfileForm,
} from "@/server/actions/organization-settings";
import { DEFAULT_WEIGHTS } from "@/lib/calculations/prioritization";

type Props = {
  searchParams: Promise<{
    orgSaved?: string;
    orgError?: string;
    prefSaved?: string;
    prefError?: string;
  }>;
};

export default async function SettingsPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email?.toLowerCase() ?? "";
  const showPlatform = email && isPlatformAdminEmail(email);

  const qs = await searchParams;
  const orgRes = await getOrganizationSettingsPayload();
  const orgPayload =
    "data" in orgRes ? orgRes.data : null;
  const orgLoadError = "error" in orgRes ? orgRes.error : null;

  const prefs = orgPayload?.preferences ?? {};
  const w = prefs.defaultPrioritizationWeights ?? DEFAULT_WEIGHTS;
  const vsmMode = prefs.defaultVsmMode ?? "lean_correct";
  const canEditOrg = orgPayload?.canEdit ?? false;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">
          Ajustes de la organización y preferencias
        </p>
      </div>

      {qs.orgSaved ? (
        <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100">
          Datos de la organización guardados.
        </p>
      ) : null}
      {qs.orgError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {qs.orgError}
        </p>
      ) : null}
      {qs.prefSaved ? (
        <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100">
          Preferencias guardadas. Los casos que ya tienen pesos propios no
          cambian; los nuevos heredan estos valores hasta que edites
          priorización en el caso.
        </p>
      ) : null}
      {qs.prefError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {qs.prefError}
        </p>
      ) : null}

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
          <CardDescription>
            Nombre y slug del tenant activo
            {!canEditOrg ? " (solo lectura con tu rol)" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orgLoadError ? (
            <p className="text-sm text-destructive">{orgLoadError}</p>
          ) : orgPayload ? (
            <form action={submitOrganizationProfileForm} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Nombre</Label>
                <Input
                  id="orgName"
                  name="name"
                  defaultValue={orgPayload.name}
                  disabled={!canEditOrg}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgSlug">Slug</Label>
                <Input
                  id="orgSlug"
                  name="slug"
                  defaultValue={orgPayload.slug}
                  disabled={!canEditOrg}
                  required
                />
              </div>
              {canEditOrg ? (
                <Button type="submit">Guardar</Button>
              ) : null}
            </form>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pesos de priorización (defecto org.)</CardTitle>
          <CardDescription>
            Se aplican a casos nuevos o sin fila en{" "}
            <code className="text-xs">prioritization_weights</code>. Deben sumar
            1.00.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={submitOrganizationPreferencesForm} className="space-y-4">
            <input type="hidden" name="defaultVsmMode" value={vsmMode} />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Impacto en lead time</Label>
                <Input
                  name="impactLeadTime"
                  type="number"
                  step="0.05"
                  defaultValue={w.impactLeadTime}
                  disabled={!canEditOrg}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Impacto económico</Label>
                <Input
                  name="impactEconomic"
                  type="number"
                  step="0.05"
                  defaultValue={w.impactEconomic}
                  disabled={!canEditOrg}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Impacto en resiliencia</Label>
                <Input
                  name="impactResilience"
                  type="number"
                  step="0.05"
                  defaultValue={w.impactResilience}
                  disabled={!canEditOrg}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Factibilidad 30 días</Label>
                <Input
                  name="feasibility30d"
                  type="number"
                  step="0.05"
                  defaultValue={w.feasibility30d}
                  disabled={!canEditOrg}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Esfuerzo (invertido)</Label>
                <Input
                  name="effort"
                  type="number"
                  step="0.05"
                  defaultValue={w.effort}
                  disabled={!canEditOrg}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Dependencia ext. (invertido)</Label>
                <Input
                  name="externalDependency"
                  type="number"
                  step="0.05"
                  defaultValue={w.externalDependency}
                  disabled={!canEditOrg}
                  required
                />
              </div>
            </div>
            {canEditOrg ? (
              <Button type="submit">Guardar pesos</Button>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Modo de cálculo VSM (defecto org.)</CardTitle>
          <CardDescription>
            Preferencia guardada en la organización; el módulo VSM del caso puede
            seguir alternando el modo en pantalla.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={submitOrganizationPreferencesForm} className="space-y-4">
            <input type="hidden" name="impactLeadTime" value={String(w.impactLeadTime)} />
            <input type="hidden" name="impactEconomic" value={String(w.impactEconomic)} />
            <input type="hidden" name="impactResilience" value={String(w.impactResilience)} />
            <input type="hidden" name="feasibility30d" value={String(w.feasibility30d)} />
            <input type="hidden" name="effort" value={String(w.effort)} />
            <input type="hidden" name="externalDependency" value={String(w.externalDependency)} />
            <div className="flex flex-col gap-3 sm:flex-row">
              <label className="flex flex-1 cursor-pointer items-start gap-3 rounded-lg border p-3 has-[:checked]:ring-2 has-[:checked]:ring-primary">
                <input
                  type="radio"
                  name="defaultVsmMode"
                  value="lean_correct"
                  defaultChecked={vsmMode === "lean_correct"}
                  disabled={!canEditOrg}
                  className="mt-1"
                />
                <span>
                  <span className="font-medium">Lean correcto</span>
                  <span className="block text-xs text-muted-foreground">
                    Tiempo de valor = solo pasos que agregan valor
                  </span>
                </span>
              </label>
              <label className="flex flex-1 cursor-pointer items-start gap-3 rounded-lg border p-3 has-[:checked]:ring-2 has-[:checked]:ring-primary">
                <input
                  type="radio"
                  name="defaultVsmMode"
                  value="compatibility"
                  defaultChecked={vsmMode === "compatibility"}
                  disabled={!canEditOrg}
                  className="mt-1"
                />
                <span>
                  <span className="font-medium">Compatibilidad Excel</span>
                  <span className="block text-xs text-muted-foreground">
                    Tiempo de valor = todos los tiempos de proceso
                  </span>
                </span>
              </label>
            </div>
            {canEditOrg ? (
              <Button type="submit">Guardar modo VSM</Button>
            ) : null}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  listMyOrganizations,
  listOrganizationMembers,
  switchActiveOrganizationAction,
} from "@/server/actions/org-members";

export default async function MembersSettingsPage() {
  const [membersRes, orgsRes] = await Promise.all([
    listOrganizationMembers(),
    listMyOrganizations(),
  ]);

  const membersError = "error" in membersRes ? membersRes.error : null;
  const orgsError = "error" in orgsRes ? orgsRes.error : null;
  const members = "data" in membersRes ? membersRes.data : null;
  const orgs = "data" in orgsRes ? orgsRes.data : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Miembros y acceso</h1>
        <p className="text-muted-foreground">
          Miembros de la organización activa y cambio de contexto multi-org
        </p>
      </div>

      {orgsError && (
        <p className="text-sm text-destructive">{orgsError}</p>
      )}

      {orgs && orgs.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organización activa</CardTitle>
            <CardDescription>
              Elige en qué organización trabajas. El rol puede variar por
              organización.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {orgs.map((o) => (
              <form
                key={o.organizationId}
                action={switchActiveOrganizationAction}
              >
                <input type="hidden" name="organizationId" value={o.organizationId} />
                <Button
                  type="submit"
                  variant={o.isActive ? "default" : "outline"}
                  className="w-full justify-start"
                >
                  {o.name}
                  <span className="ml-2 text-muted-foreground">({o.role})</span>
                  {o.isActive ? (
                    <span className="ml-auto text-xs">activa</span>
                  ) : null}
                </Button>
              </form>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Miembros</CardTitle>
          <CardDescription>
            Usuarios con membresía en la organización activa (rol por
            organización).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {membersError ? (
            <p className="text-sm text-destructive">{membersError}</p>
          ) : members && members.length > 0 ? (
            <ul className="divide-y rounded-md border">
              {members.map((m) => (
                <li
                  key={m.userId}
                  className="flex flex-col gap-0.5 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-medium">{m.fullName}</span>
                  <span className="text-muted-foreground">{m.email}</span>
                  <span className="text-xs uppercase text-muted-foreground">
                    {m.role}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay miembros listados.
            </p>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Los facilitadores y administradores pueden asignar participantes a
            un caso mediante la acción de servidor{" "}
            <code className="rounded bg-muted px-1">assignUserToCase</code>{" "}
            (integración o futuras pantallas en el detalle del caso).
          </p>
        </CardContent>
      </Card>

      <Link
        href="/dashboard/settings"
        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        Volver a configuración
      </Link>
    </div>
  );
}

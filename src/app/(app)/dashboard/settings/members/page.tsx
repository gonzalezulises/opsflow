import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  listMyOrganizations,
  listOrganizationMembers,
  switchActiveOrganizationAction,
} from "@/server/actions/org-members";
import {
  listPendingOrganizationInvites,
  submitOrganizationInviteForm,
} from "@/server/actions/organization";

type Props = {
  searchParams: Promise<{
    inviteSent?: string;
    inviteError?: string;
    inviteUrl?: string;
    inviteEmailSent?: string;
    inviteEmailNote?: string;
  }>;
};

export default async function MembersSettingsPage({ searchParams }: Props) {
  const qs = await searchParams;
  const [membersRes, orgsRes, invitesRes] = await Promise.all([
    listOrganizationMembers(),
    listMyOrganizations(),
    listPendingOrganizationInvites(),
  ]);

  const membersError = "error" in membersRes ? membersRes.error : null;
  const orgsError = "error" in orgsRes ? orgsRes.error : null;
  const members = "data" in membersRes ? membersRes.data : null;
  const orgs = "data" in orgsRes ? orgsRes.data : null;
  const invites = "data" in invitesRes ? invitesRes.data : null;
  const invitesError = "error" in invitesRes ? invitesRes.error : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Miembros y acceso</h1>
        <p className="text-muted-foreground">
          Miembros de la organización activa, invitaciones y cambio de contexto
          multi-org
        </p>
      </div>

      {qs.inviteSent ? (
        <div className="space-y-2 rounded-md border border-green-200 bg-green-50 px-3 py-3 text-sm text-green-900 dark:border-green-900 dark:bg-green-950 dark:text-green-100">
          <p>Invitación creada correctamente.</p>
          {qs.inviteEmailSent === "1" ? (
            <p className="text-xs font-medium">
              Se envió un correo al destinatario con el enlace (Resend).
            </p>
          ) : qs.inviteEmailNote ? (
            <p className="text-xs text-amber-900 dark:text-amber-100">
              {qs.inviteEmailNote}
            </p>
          ) : null}
          {qs.inviteUrl ? (
            <div className="space-y-1">
              <p className="text-xs font-medium">
                Enlace (por si el correo no llegó o no está configurado Resend):
              </p>
              <code className="block break-all rounded bg-white/80 p-2 text-xs text-foreground dark:bg-black/30">
                {qs.inviteUrl}
              </code>
            </div>
          ) : null}
        </div>
      ) : null}
      {qs.inviteError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {qs.inviteError}
        </p>
      ) : null}

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

      {!invitesError && invites !== null ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invitar miembro</CardTitle>
            <CardDescription>
              Genera una invitación (válida 7 días). Con Resend configurado se envía el
              enlace por correo; siempre puedes copiar el enlace manualmente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={submitOrganizationInviteForm} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Correo</Label>
                <Input
                  id="invite-email"
                  name="email"
                  type="email"
                  required
                  placeholder="colaborador@empresa.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Rol en la organización</Label>
                <select
                  id="invite-role"
                  name="role"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                  defaultValue="participant"
                >
                  <option value="participant">Participante</option>
                  <option value="observer">Observador</option>
                  <option value="facilitator">Facilitador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <Button type="submit">Crear invitación</Button>
            </form>
            {(invites ?? []).length > 0 ? (
              <div className="border-t pt-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Invitaciones pendientes
                </p>
                <ul className="space-y-1 text-sm">
                  {(invites ?? []).map((i) => (
                    <li key={i.id} className="flex justify-between gap-2">
                      <span>{i.email}</span>
                      <span className="text-muted-foreground uppercase">
                        {i.role}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : invitesError ? (
        <p className="text-xs text-muted-foreground">{invitesError}</p>
      ) : null}

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
            Los facilitadores y administradores pueden asignar participantes desde
            el panel <strong>Participantes del caso</strong> en cada caso, o vía la
            acción{" "}
            <code className="rounded bg-muted px-1">assignUserToCase</code>.
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

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import {
  getInvitePreview,
  submitAcceptInviteForm,
} from "@/server/actions/organization";

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function InvitePage({ params, searchParams }: Props) {
  const { token } = await params;
  const qs = await searchParams;
  const preview = await getInvitePreview(token);

  if ("error" in preview) {
    return (
      <div className="mx-auto max-w-lg py-12">
        <Card>
          <CardHeader>
            <CardTitle>Invitación</CardTitle>
            <CardDescription className="text-destructive">
              {preview.error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" render={<Link href="/login" />}>
              Iniciar sesión
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const loginHref = `/login?next=${encodeURIComponent(`/invite/${token}`)}`;

  return (
    <div className="mx-auto max-w-lg space-y-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Invitación a organización</CardTitle>
          <CardDescription>
            Te invitaron a <strong>{preview.data.organizationName}</strong> como{" "}
            <span className="uppercase">{preview.data.role}</span>. Correo de
            la invitación: <strong>{preview.data.email}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {qs.error ? (
            <p className="text-sm text-destructive">{qs.error}</p>
          ) : null}

          {!user ? (
            <p className="text-sm text-muted-foreground">
              Inicia sesión con el mismo correo al que llegó la invitación.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Sesión: <strong>{user.email}</strong>
            </p>
          )}

          {!user ? (
            <Button render={<Link href={loginHref} />}>Iniciar sesión</Button>
          ) : (
            <form action={submitAcceptInviteForm}>
              <input type="hidden" name="token" value={token} />
              <Button type="submit">Aceptar invitación</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

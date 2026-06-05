import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdminEmail } from "@/server/auth/platform";

export default async function PendingAccessPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email?.toLowerCase() ?? "";
  const showPlatformCreate = email && isPlatformAdminEmail(email);

  return (
    <div className="mx-auto max-w-lg space-y-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Acceso pendiente</CardTitle>
          <CardDescription>
            Tu sesión está activa, pero tu cuenta aún no pertenece a ninguna
            organización en OpsFlow.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Si recibiste un enlace de invitación, ábrelo en este mismo navegador
            (con la sesión iniciada) para aceptarla.
          </p>
          {showPlatformCreate ? (
            <p>
              Como administrador de plataforma puedes{" "}
              <Link
                className="font-medium text-foreground underline"
                href="/organization/new"
              >
                crear una organización
              </Link>{" "}
              sin invitación previa.
            </p>
          ) : (
            <p>
              Si eres administrador de plataforma, pide que añadan tu correo a{" "}
              <code className="rounded bg-muted px-1 text-foreground">
                OPSFLOW_PLATFORM_ADMIN_EMAILS
              </code>{" "}
              y crea un tenant desde &quot;Nueva organización&quot;.
            </p>
          )}
          <div className="flex flex-wrap gap-2 pt-2">
            {showPlatformCreate ? (
              <Button render={<Link href="/organization/new" />}>
                Nueva organización
              </Button>
            ) : null}
            <Button variant="outline" render={<Link href="/" />}>
              Inicio
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

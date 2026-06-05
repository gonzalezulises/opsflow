import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdminEmail } from "@/server/auth/platform";
import { submitCreateOrganizationForm } from "@/server/actions/organization";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function NewOrganizationPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email?.toLowerCase() ?? "";
  if (!email || !isPlatformAdminEmail(email)) {
    redirect("/dashboard/settings");
  }

  const qs = await searchParams;

  return (
    <div className="mx-auto max-w-lg space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Nueva organización</h1>
        <p className="text-muted-foreground">
          Crea un tenant (organización) para producción multi-cliente.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos</CardTitle>
          <CardDescription>
            El slug es único; usa minúsculas y guiones (ej.{" "}
            <code className="text-foreground">acme-corp</code>).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {qs.error ? (
            <p className="mb-4 text-sm text-destructive">{qs.error}</p>
          ) : null}
          <form action={submitCreateOrganizationForm} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" required placeholder="Acme Corp" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                name="slug"
                required
                placeholder="acme-corp"
                pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              />
            </div>
            <Button type="submit">Crear organización</Button>
          </form>
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

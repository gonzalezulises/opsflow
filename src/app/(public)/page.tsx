import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  // Acceso libre por ahora — redirige directo al dashboard
  redirect("/dashboard");
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <span className="text-xl font-bold">OpsFlow</span>
          <Link href="/login">
            <Button variant="outline">Iniciar sesión</Button>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center">
        <div className="mx-auto max-w-3xl space-y-8 px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Optimización operativa
            <br />
            <span className="text-muted-foreground">inteligente y contextualizada</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted-foreground">
            Diagnostica, analiza y mejora tus procesos operativos con un workflow
            guiado y asistencia de IA. Diseñado para la realidad de Latinoamérica.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/login">
              <Button size="lg">Comenzar</Button>
            </Link>
          </div>

          <div className="grid gap-6 pt-12 sm:grid-cols-3">
            <div className="space-y-2 rounded-lg border p-6">
              <h3 className="font-semibold">Diagnóstico de madurez</h3>
              <p className="text-sm text-muted-foreground">
                Evalúa 15 dimensiones operativas y obtén tu nivel de madurez.
              </p>
            </div>
            <div className="space-y-2 rounded-lg border p-6">
              <h3 className="font-semibold">Mapeo VSM</h3>
              <p className="text-sm text-muted-foreground">
                Identifica cuellos de botella, esperas y oportunidades quick win.
              </p>
            </div>
            <div className="space-y-2 rounded-lg border p-6">
              <h3 className="font-semibold">Plan de 30 días</h3>
              <p className="text-sm text-muted-foreground">
                Genera un plan accionable con seguimiento semanal y asistencia IA.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        OpsFlow — Optimización operativa inteligente
      </footer>
    </div>
  );
}

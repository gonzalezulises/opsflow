import { AppHeader } from "@/components/layout/app-header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
      <footer className="border-t py-5 text-center text-sm text-muted-foreground print:hidden">
        Desarrollo exclusivo para el Bootcamp IESA por <a href="https://www.linkedin.com/in/ulisesgonzalez/?locale=es_ES" target="_blank" rel="noopener noreferrer" className="font-semibold text-foreground hover:underline">Ulises González</a> — 2026
      </footer>
    </div>
  );
}

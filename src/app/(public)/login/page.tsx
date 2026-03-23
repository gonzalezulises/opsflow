import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">OpsFlow</h1>
          <p className="mt-2 text-muted-foreground">
            Optimización operativa inteligente
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}

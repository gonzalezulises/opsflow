import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Eye } from "lucide-react";

export function ReadOnlyCaseBanner() {
  return (
    <Alert className="border-amber-500/50 bg-amber-500/10">
      <Eye className="size-4 text-amber-700" />
      <AlertTitle>Modo solo lectura</AlertTitle>
      <AlertDescription>
        Tu rol no permite editar este caso. Puedes revisar datos y reportes; solicita a un facilitador
        los cambios que necesites.
      </AlertDescription>
    </Alert>
  );
}

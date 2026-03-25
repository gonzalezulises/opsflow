"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createBlankCase } from "@/server/actions/cases";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function CreateBlankButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      const result = await createBlankCase("Nuevo caso");
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.data) {
        router.push(`/dashboard/cases/${result.data.id}/context`);
      }
    });
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={isPending}>
      {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
      Crear en blanco
    </Button>
  );
}

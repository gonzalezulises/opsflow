"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createCaseFromTemplate } from "@/server/actions/cases";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CreateFromTemplateButtonProps {
  templateId: string;
  templateName: string;
}

export function CreateFromTemplateButton({
  templateId,
  templateName,
}: CreateFromTemplateButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      const result = await createCaseFromTemplate(
        templateId,
        `Copia de ${templateName}`,
      );
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
    <Button onClick={handleClick} disabled={isPending}>
      {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
      Usar caso base
    </Button>
  );
}

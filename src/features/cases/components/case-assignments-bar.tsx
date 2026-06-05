"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { assignUserToCase } from "@/server/actions/org-members";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type CaseAssigneeRow = {
  userId: string;
  email: string;
  fullName: string;
};

export function CaseAssignmentsBar({
  caseId,
  initialAssignees,
  canManage,
}: {
  caseId: string;
  initialAssignees: CaseAssigneeRow[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [assignees, setAssignees] = useState(initialAssignees);
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setAssignees(initialAssignees);
  }, [initialAssignees]);

  function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      toast.error("Introduce un correo.");
      return;
    }
    startTransition(async () => {
      const res = await assignUserToCase({
        caseId,
        userEmail: trimmed,
      });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Participante asignado al caso.");
      setEmail("");
      router.refresh();
    });
  }

  if (!canManage && assignees.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Participantes del caso</CardTitle>
        <CardDescription>
          Quién puede ver y editar este caso como participante (además de
          facilitadores y administradores).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {assignees.length > 0 ? (
          <ul className="divide-y rounded-md border text-sm">
            {assignees.map((a) => (
              <li
                key={a.userId}
                className="flex flex-col gap-0.5 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="font-medium">{a.fullName}</span>
                <span className="text-muted-foreground">{a.email}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aún no hay participantes asignados a este caso.
          </p>
        )}

        {canManage ? (
          <form onSubmit={handleAssign} className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor={`assign-email-${caseId}`}>Correo del miembro</Label>
              <Input
                id={`assign-email-${caseId}`}
                type="email"
                placeholder="persona@organización.com"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                disabled={pending}
                autoComplete="off"
              />
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Asignando…" : "Asignar"}
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}

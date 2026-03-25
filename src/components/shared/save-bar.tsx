"use client";

import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface SaveBarProps {
  dirty: boolean;
  saving: boolean;
  lastSaved: Date | null;
  error: string | null;
  onSave: () => void;
  label?: string;
  children?: React.ReactNode;
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return "justo ahora";
  if (seconds < 60) return `hace ${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes}min`;
  return date.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
}

export function SaveBar({
  dirty,
  saving,
  lastSaved,
  error,
  onSave,
  label = "Guardar",
  children,
}: SaveBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {children}

      {/* Status indicator */}
      <div className="ml-auto flex items-center gap-2 text-sm">
        {error && (
          <span className="flex items-center gap-1 text-destructive">
            <AlertCircle className="size-3.5" />
            {error}
          </span>
        )}

        {!error && lastSaved && !dirty && (
          <span className="flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="size-3.5" />
            Guardado {timeAgo(lastSaved)}
          </span>
        )}

        {dirty && !saving && (
          <span className="text-amber-600 font-medium">
            Cambios sin guardar
          </span>
        )}
      </div>

      <Button onClick={onSave} disabled={saving || (!dirty && !error)}>
        {saving && <Loader2 className="mr-2 size-4 animate-spin" />}
        {saving ? "Guardando..." : label}
      </Button>
    </div>
  );
}

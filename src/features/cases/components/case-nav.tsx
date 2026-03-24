"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { CASE_MODULES } from "@/lib/constants/modules";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Check } from "lucide-react";

export function CaseNav() {
  const pathname = usePathname();
  const params = useParams<{ caseId: string }>();
  const basePath = `/dashboard/cases/${params.caseId}`;

  const currentModule = CASE_MODULES.find((mod) => {
    const href = `${basePath}/${mod.path}`;
    return pathname.startsWith(href) || (mod.path === "context" && pathname === basePath);
  });

  const CurrentIcon = currentModule?.icon;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Paso {(currentModule?.order ?? 0) + 1} de {CASE_MODULES.length}</span>
        <span className="text-xs">—</span>
        <span className="font-medium text-foreground">{currentModule?.label}</span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="outline" size="sm" />}
        >
          {CurrentIcon && <CurrentIcon className="mr-2 size-4" />}
          {currentModule?.shortLabel ?? "Módulos"}
          <ChevronDown className="ml-2 size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {CASE_MODULES.map((mod) => {
            const href = `${basePath}/${mod.path}`;
            const isActive =
              pathname.startsWith(href) ||
              (mod.path === "context" && pathname === basePath);
            const Icon = mod.icon;

            return (
              <DropdownMenuItem key={mod.id} render={<Link href={href} />}>
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs">
                  {mod.order + 1}
                </span>
                <Icon className="size-4 shrink-0" />
                <span className={cn("flex-1", isActive && "font-medium")}>{mod.shortLabel}</span>
                {isActive && <Check className="size-4 text-primary" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

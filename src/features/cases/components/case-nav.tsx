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
    <div className="space-y-2 print-hidden">
      {/* Step bar — always visible */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-lg border bg-muted/50 p-1">
        {CASE_MODULES.map((mod) => {
          const href = `${basePath}/${mod.path}`;
          const isActive =
            pathname.startsWith(href) ||
            (mod.path === "context" && pathname === basePath);
          const Icon = mod.icon;

          return (
            <Link
              key={mod.id}
              href={href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full text-[10px] font-bold",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {mod.order + 1}
              </span>
              <Icon className="size-3.5" />
              <span className="hidden lg:inline">{mod.shortLabel}</span>
            </Link>
          );
        })}
      </div>

      {/* Current step label + dropdown (mobile fallback) */}
      <div className="flex items-center justify-between lg:hidden">
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
    </div>
  );
}

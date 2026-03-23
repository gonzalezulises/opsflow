"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { CASE_MODULES } from "@/lib/constants/modules";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export function CaseNav() {
  const pathname = usePathname();
  const params = useParams<{ caseId: string }>();
  const basePath = `/dashboard/cases/${params.caseId}`;

  return (
    <ScrollArea className="w-full">
      <nav className="flex gap-1 border-b pb-2">
        {CASE_MODULES.map((mod) => {
          const href = `${basePath}/${mod.path}`;
          const isActive =
            pathname === href ||
            (mod.path === "context" && pathname === basePath);
          const Icon = mod.icon;

          return (
            <Link
              key={mod.id}
              href={href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              <span className="hidden sm:inline">{mod.shortLabel}</span>
            </Link>
          );
        })}
      </nav>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

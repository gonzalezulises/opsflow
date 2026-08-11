"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/constants/modules";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b bg-[#0a1628] text-white print-hidden">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/iesa-60-logo.png" alt="IESA 60" width={90} height={32} className="h-8 w-auto" />
          <span className="border-l border-white/25 pl-3 text-lg font-bold">
            <span className="text-[#93c5fd]">Ops</span>Flow
          </span>
        </Link>

        <nav className="flex items-center gap-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(item.path + "/");
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                  isActive
                    ? "bg-white/15 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon className="size-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

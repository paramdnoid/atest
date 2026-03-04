"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const legalPages = [
  { href: "/legal/imprint", label: "Impressum" },
  { href: "/legal/privacy", label: "Datenschutz" },
  { href: "/legal/terms", label: "AGB" },
] as const;

export function LegalNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Rechtliche Seiten" className="-mb-px flex gap-6">
      {legalPages.map((page) => {
        const isActive = pathname === page.href;
        return (
          <Link
            key={page.href}
            href={page.href}
            className={cn(
              "border-b-2 pb-3 text-sm font-medium transition-colors",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {page.label}
          </Link>
        );
      })}
    </nav>
  );
}

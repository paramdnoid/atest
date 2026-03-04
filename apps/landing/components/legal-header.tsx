"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const legalPages = [
  { href: "/legal/imprint", label: "Impressum" },
  { href: "/legal/privacy", label: "Datenschutz" },
  { href: "/legal/terms", label: "AGB" },
] as const;

export function LegalHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 executive-nav border-b shadow-[0_2px_18px_-10px_rgba(2,6,23,0.45)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center py-3">
          <div className="justify-self-start">
            <BrandLogo priority />
          </div>

          {/* Legal page tabs — centered */}
          <nav aria-label="Rechtliche Seiten" className="hidden sm:flex items-center gap-8 justify-self-center">
            {legalPages.map((page) => {
              const isActive = pathname === page.href;
              return (
                <Link
                  key={page.href}
                  href={page.href}
                  className={cn(
                    "text-sm font-semibold transition-colors",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  {page.label}
                </Link>
              );
            })}
          </nav>

          <Button
            asChild
            size="sm"
            className="justify-self-end bg-primary/95 hover:bg-primary text-primary-foreground border-primary/80 border font-semibold tracking-[0.06em] uppercase transition-all"
          >
            <Link href="/">Zur Startseite</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

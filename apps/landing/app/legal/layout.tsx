import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Header } from "@/components/header";
import { LegalNav } from "@/components/legal-nav";
import { LegalTableOfContents } from "@/components/legal-toc";
import { Footer } from "@/components/sections/footer";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Header />

      {/* ── Top bar: breadcrumb + tab navigation ─────────────────────── */}
      <div className="border-b border-border/50 bg-muted/30 pt-20">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 pt-5 pb-4 text-xs text-muted-foreground"
          >
            <Link
              href="/"
              className="transition-colors hover:text-foreground"
            >
              Startseite
            </Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="text-foreground font-medium">Rechtliches</span>
          </nav>
          <LegalNav />
        </div>
      </div>

      {/* ── Content area ─────────────────────────────────────────────── */}
      <main
        id="main-content"
        className="mx-auto max-w-5xl px-6 py-10 sm:py-14 lg:px-8"
      >
        <div className="grid grid-cols-1 gap-12 xl:grid-cols-[1fr_200px]">
          <div
            className="legal-article-wrapper min-w-0"
            data-legal-article=""
          >
            {children}
          </div>
          <LegalTableOfContents />
        </div>
      </main>

      <Footer />
    </div>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { BrandLogo } from "@/components/brand-logo";
import { FaqDialog } from "@/components/faq-dialog";
import { SectionContainer } from "@/components/section-container";
import { useAnchorScroll } from "@/hooks/use-anchor-scroll";
import { useHeaderScroll } from "@/hooks/use-header-scroll";

const navLinks = [
  { href: "#trades", label: "Gewerke" },
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "So funktioniert's" },
  { href: "#pricing", label: "Preise" },
] as const;

function getAnchorOffset(href: string, isDesktop: boolean) {
  return href === "#pricing" ? (isDesktop ? 64 : 60) : (isDesktop ? 92 : 80);
}

type HeaderProps = {
  revealDelayMs?: number;
};

export function Header({ revealDelayMs = 0 }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(revealDelayMs <= 0);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const scrolled = useHeaderScroll();
  const { handleNavLinkClick } = useAnchorScroll(getAnchorOffset);

  // Reveal animation delay
  useEffect(() => {
    if (revealDelayMs <= 0) {
      const id = window.setTimeout(() => setIsVisible(true), 0);
      return () => window.clearTimeout(id);
    }

    const timeoutId = window.setTimeout(() => setIsVisible(true), revealDelayMs);
    return () => window.clearTimeout(timeoutId);
  }, [revealDelayMs]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Close mobile menu on Escape and return focus
  useEffect(() => {
    if (!mobileOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileOpen(false);
        menuButtonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,box-shadow,opacity,transform] duration-500 ease-out",
        scrolled || mobileOpen
          ? "executive-nav border-b shadow-[0_2px_18px_-10px_rgba(2,6,23,0.45)]"
          : "border-b border-transparent bg-transparent",
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0 pointer-events-none",
      ].join(" ")}
      {...(!isVisible ? { "aria-hidden": true, inert: true } : {})}
    >
      <SectionContainer className="py-3">
        <div className="flex items-center justify-between lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <div className="justify-self-start">
            <BrandLogo priority />
          </div>

          {/* Desktop nav */}
          <nav
            className="hidden items-center gap-8 lg:flex lg:justify-self-center"
            aria-label="Hauptnavigation"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(event) => handleNavLinkClick(event, link.href)}
                className="nav-link-enterprise text-muted-foreground hover:text-foreground font-semibold transition-colors"
              >
                {link.label}
              </a>
            ))}
            <FaqDialog>
              <button
                type="button"
                className="nav-link-enterprise text-muted-foreground hover:text-foreground font-semibold transition-colors"
              >
                FAQ
              </button>
            </FaqDialog>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden items-center gap-3 lg:flex lg:justify-self-end">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="font-semibold tracking-[0.06em] uppercase"
            >
              <Link href="/login">Anmelden</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-primary/95 hover:bg-primary text-primary-foreground border-primary/80 border font-semibold tracking-[0.06em] uppercase transition-all"
            >
              <Link href="/onboarding">Testphase starten</Link>
            </Button>
          </div>

          {/* Mobile menu toggle */}
          <button
            ref={menuButtonRef}
            type="button"
            className="text-muted-foreground hover:bg-accent hover:text-foreground inline-flex h-11 w-11 items-center justify-center rounded-md transition-colors lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileOpen ? "Menü schließen" : "Menü öffnen"}
          >
            <span className="relative h-5 w-5">
              <Menu
                className={`absolute inset-0 h-5 w-5 transition-all duration-200 ${mobileOpen ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"}`}
              />
              <X
                className={`absolute inset-0 h-5 w-5 transition-all duration-200 ${mobileOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"}`}
              />
            </span>
          </button>
        </div>
      </SectionContainer>

      {/* Mobile nav */}
      <nav
        id="mobile-navigation"
        className={[
          "executive-nav border-t lg:hidden",
          "transition-all duration-300 ease-out",
          mobileOpen
            ? "max-h-[calc(100dvh-4.25rem)] overflow-y-auto overscroll-contain opacity-100"
            : "pointer-events-none max-h-0 overflow-hidden opacity-0",
        ].join(" ")}
        aria-label="Mobile Navigation"
        aria-hidden={!mobileOpen}
      >
        <SectionContainer className="flex flex-col gap-1 py-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(event) =>
                handleNavLinkClick(event, link.href, {
                  onBeforeScroll: mobileOpen ? closeMobile : undefined,
                })
              }
              tabIndex={mobileOpen ? 0 : -1}
              className="hover:bg-accent/60 active:bg-accent/80 rounded-md px-3 py-3 text-sm font-semibold tracking-[0.08em] uppercase transition-colors"
            >
              {link.label}
            </a>
          ))}
          <FaqDialog onOpenChange={(open) => { if (open) closeMobile(); }}>
            <button
              type="button"
              tabIndex={mobileOpen ? 0 : -1}
              className="hover:bg-accent/60 active:bg-accent/80 rounded-md px-3 py-3 text-left text-sm font-semibold tracking-[0.08em] uppercase transition-colors"
            >
              FAQ
            </button>
          </FaqDialog>
          <div className="border-border/20 mt-3 flex flex-col gap-2 border-t pt-4">
            <Button
              asChild
              variant="outline"
              className="h-11 w-full"
              tabIndex={mobileOpen ? 0 : -1}
            >
              <Link href="/login" onClick={closeMobile}>Anmelden</Link>
            </Button>
            <Button
              asChild
              className="h-11 w-full"
              tabIndex={mobileOpen ? 0 : -1}
            >
              <Link href="/onboarding" onClick={closeMobile}>Testphase starten</Link>
            </Button>
          </div>
        </SectionContainer>
      </nav>
    </header>
  );
}

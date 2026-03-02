"use client";

import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { type MouseEvent, useCallback, useEffect, useRef, useState } from "react";

import { BrandLogo } from "@/components/brand-logo";
import { FaqDialog } from "@/components/faq-dialog";
import { SectionContainer } from "@/components/section-container";
import { HEADER_SCROLL_THRESHOLD, SCROLL_THROTTLE_MS } from "@/lib/constants";

const navLinks = [
  { href: "#trades", label: "Gewerke" },
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "So funktioniert's" },
  { href: "#pricing", label: "Preise" },
] as const;

type HeaderProps = {
  revealDelayMs?: number;
};

export function Header({ revealDelayMs = 0 }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(revealDelayMs <= 0);
  const rafId = useRef<number>(0);
  const lastScrollTime = useRef(0);

  const handleScroll = useCallback(() => {
    const now = performance.now();
    if (now - lastScrollTime.current < SCROLL_THROTTLE_MS) {
      cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        setScrolled(window.scrollY > HEADER_SCROLL_THRESHOLD);
        lastScrollTime.current = performance.now();
      });
      return;
    }
    lastScrollTime.current = now;
    setScrolled(window.scrollY > HEADER_SCROLL_THRESHOLD);
  }, []);

  useEffect(() => {
    const initId = requestAnimationFrame(() => {
      handleScroll();
    });
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      cancelAnimationFrame(initId);
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId.current);
    };
  }, [handleScroll]);

  useEffect(() => {
    if (revealDelayMs <= 0) {
      const id = window.setTimeout(() => {
        setIsVisible(true);
      }, 0);
      return () => window.clearTimeout(id);
    }

    const timeoutId = window.setTimeout(() => {
      setIsVisible(true);
    }, revealDelayMs);

    return () => window.clearTimeout(timeoutId);
  }, [revealDelayMs]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const getAnchorOffset = useCallback((href: string, isDesktop: boolean) => {
    return href === "#pricing" ? (isDesktop ? 64 : 60) : (isDesktop ? 92 : 80);
  }, []);

  const scrollToAnchor = useCallback(
    (
      href: string,
      options?: {
        behavior?: ScrollBehavior;
        updateHash?: boolean;
      }
    ) => {
      if (!href.startsWith("#")) return;
      const target = document.querySelector<HTMLElement>(href);
      if (!target) return;

      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
      const headerOffset = getAnchorOffset(href, isDesktop);
      const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top, behavior: options?.behavior ?? "smooth" });
      if ((options?.updateHash ?? true) && window.location.hash !== href) {
        window.history.replaceState(null, "", href);
      }
    },
    [getAnchorOffset]
  );

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith("#")) return;

    let timeoutId = 0;
    let attempts = 0;
    const maxAttempts = 60;

    const tryScroll = () => {
      const target = document.querySelector<HTMLElement>(hash);
      if (target) {
        scrollToAnchor(hash, { behavior: "auto", updateHash: false });
        return;
      }

      attempts += 1;
      if (attempts < maxAttempts) {
        timeoutId = window.setTimeout(tryScroll, 50);
      }
    };

    tryScroll();
    return () => window.clearTimeout(timeoutId);
  }, [scrollToAnchor]);

  const handleNavLinkClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, href: string) => {
      if (!href.startsWith("#")) return;
      event.preventDefault();

      if (mobileOpen) {
        setMobileOpen(false);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            scrollToAnchor(href);
          });
        });
        return;
      }

      scrollToAnchor(href);
    },
    [mobileOpen, scrollToAnchor]
  );

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,box-shadow,opacity,transform] duration-500 ease-out",
        scrolled || mobileOpen
          ? "executive-nav border-b shadow-[0_2px_18px_-10px_rgba(2,6,23,0.45)]"
          : "border-b border-transparent bg-transparent",
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0 pointer-events-none",
      ].join(" ")}
      role="banner"
    >
      <SectionContainer className="py-3">
        <div className="flex items-center justify-between lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <div className="justify-self-start">
            <BrandLogo priority />
          </div>

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
              <Link href="/onboarding">Kostenlos testen</Link>
            </Button>
          </div>

          <button
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
              onClick={(event) => handleNavLinkClick(event, link.href)}
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
              <Link href="/onboarding" onClick={closeMobile}>Kostenlos testen</Link>
            </Button>
          </div>
        </SectionContainer>
      </nav>
    </header>
  );
}

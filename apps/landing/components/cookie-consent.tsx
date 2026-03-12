"use client";

import { Button } from "@/components/ui/button";
import { ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { COOKIE_CONSENT_DELAY_MS, COOKIE_CONSENT_KEY } from "@/lib/constants";

type ConsentValue = "all" | "necessary" | null;

const VALID_CONSENT_VALUES = new Set<string>(["all", "necessary"]);
const CONSENT_API_URL = process.env.NEXT_PUBLIC_API_URL;

function getVisitorId(): string {
  const key = "zg_visitor_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

function getStoredConsent(): ConsentValue {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (stored && VALID_CONSENT_VALUES.has(stored)) return stored as "all" | "necessary";
  return null;
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const accept = useCallback((value: "all" | "necessary") => {
    localStorage.setItem(COOKIE_CONSENT_KEY, value);
    // Fire and forget — don't block UI.
    // Only call backend if an explicit API URL is configured.
    if (CONSENT_API_URL) {
      fetch(`${CONSENT_API_URL}/v1/consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent: value, visitorId: getVisitorId() }),
      }).catch(() => {}); // Silent fail — localStorage is the source of truth
    }
    setVisible(false);
    previousFocusRef.current?.focus();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!getStoredConsent()) {
        setVisible(true);
        previousFocusRef.current = document.activeElement as HTMLElement;
      }
    }, COOKIE_CONSENT_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!visible || !dialogRef.current) return;

    const dialog = dialogRef.current;
    const focusableElements = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    firstFocusable?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        accept("necessary");
        return;
      }
      if (e.key === "Tab") {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable?.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable?.focus();
          }
        }
      }
    }

    dialog.addEventListener("keydown", handleKeyDown);
    return () => dialog.removeEventListener("keydown", handleKeyDown);
  }, [accept, visible]);

  if (!visible) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Cookie-Einstellungen"
      aria-describedby="cookie-consent-desc"
      className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6"
    >
      <div className="cookie-consent-surface animate-panel-enter relative mx-auto max-w-3xl rounded-2xl p-5 sm:p-6">
        <button
          onClick={() => accept("necessary")}
          className="text-muted-foreground hover:bg-accent hover:text-foreground absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md transition-colors"
          aria-label="Cookie-Banner schließen"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col gap-4 sm:gap-5">
          <div className="flex items-start gap-3 pr-8">
            <div className="bg-primary/12 text-primary mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/30">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>

            <div className="min-w-0">
              <p className="text-base font-semibold tracking-tight">Cookie-Einstellungen</p>
              <p
                id="cookie-consent-desc"
                className="mt-1.5 max-w-[62ch] text-sm leading-6 text-foreground/90"
              >
                Wir verwenden Cookies, um Ihnen die bestmögliche Erfahrung zu bieten.
                Weitere Informationen finden Sie in unserer{" "}
                <Link
                  href="/legal/privacy"
                  className="text-primary font-semibold underline decoration-primary/40 underline-offset-3 transition-colors hover:decoration-primary"
                >
                  Datenschutzerklärung
                </Link>
                .
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 sm:gap-2.5 md:flex md:items-center md:justify-end">
            <Button
              variant="outline"
              size="default"
              onClick={() => accept("necessary")}
              className="h-11 w-full border-border/80 bg-background/90 text-sm font-semibold hover:bg-muted md:w-auto md:min-w-40"
            >
              Nur notwendige
            </Button>
            <Button
              size="default"
              onClick={() => accept("all")}
              className="h-11 w-full text-sm font-semibold shadow-sm md:w-auto md:min-w-40"
            >
              Alle akzeptieren
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

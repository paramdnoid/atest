"use client";

import { Button } from "@/components/ui/button";
import { ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { COOKIE_CONSENT_DELAY_MS, COOKIE_CONSENT_KEY } from "@/lib/constants";

type ConsentValue = "all" | "necessary" | null;

const VALID_CONSENT_VALUES = new Set<string>(["all", "necessary"]);

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
  }, [visible]);

  const accept = useCallback((value: "all" | "necessary") => {
    localStorage.setItem(COOKIE_CONSENT_KEY, value);
    // Fire and forget — don't block UI
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}/v1/consent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent: value, visitorId: getVisitorId() }),
      }
    ).catch(() => {}); // Silent fail — localStorage is the source of truth
    setVisible(false);
    previousFocusRef.current?.focus();
  }, []);

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
      <div className="premium-panel shadow-elevated animate-panel-enter mx-auto flex max-w-2xl flex-col gap-4 rounded-xl border-l-2 border-l-primary p-5 sm:flex-row sm:items-center sm:gap-5">
        <div className="flex flex-1 items-start gap-3">
          <ShieldCheck className="text-primary mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold">Cookie-Einstellungen</p>
            <p id="cookie-consent-desc" className="text-muted-foreground mt-1 text-xs leading-relaxed">
              Wir verwenden Cookies, um Ihnen die bestmögliche Erfahrung zu bieten.
              Weitere Informationen finden Sie in unserer{" "}
              <Link
                href="/legal/privacy"
                className="text-primary font-medium underline-offset-4 hover:underline"
              >
                Datenschutzerklärung
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="default"
            onClick={() => accept("necessary")}
          >
            Nur notwendige
          </Button>
          <Button size="default" onClick={() => accept("all")}>
            Alle akzeptieren
          </Button>
          <button
            onClick={() => accept("necessary")}
            className="text-muted-foreground hover:bg-accent hover:text-foreground ml-1 flex h-7 w-7 items-center justify-center rounded-md transition-colors sm:hidden"
            aria-label="Cookie-Banner schließen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

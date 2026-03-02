"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { faqs } from "@/content/faqs";
import { useRecentSearches } from "@/hooks/use-recent-searches";
import { highlightText } from "@/lib/highlight-text";
import { HelpCircle, Search } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

/* ── Types ──────────────────────────────────────────────────────── */

type FaqDialogProps = {
  children: ReactNode;
  title?: string;
  description?: string;
  supportEmail?: string;
  showSearch?: boolean;
  showCategories?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type FaqCategory =
  | "Allgemein"
  | "Preise & Abrechnung"
  | "Plattform & Nutzung"
  | "Datenschutz"
  | "Support";

type DialogFaqItem = {
  id: string;
  question: string;
  answer: string;
  category: FaqCategory;
};

/* ── Data ───────────────────────────────────────────────────────── */

function inferCategory(question: string): FaqCategory {
  const q = question.toLowerCase();
  if (q.includes("abrechnung") || q.includes("kostenlos")) return "Preise & Abrechnung";
  if (q.includes("gerät") || q.includes("offline")) return "Plattform & Nutzung";
  if (q.includes("dsgvo") || q.includes("datenschutz")) return "Datenschutz";
  if (q.includes("support")) return "Support";
  return "Allgemein";
}

const ENTERPRISE_FAQS: DialogFaqItem[] = faqs.map((faq, index) => ({
  id: `faq-${index}`,
  question: faq.question,
  answer: faq.answer,
  category: inferCategory(faq.question),
}));

/* ── Component ──────────────────────────────────────────────────── */

export function FaqDialog({
  children,
  title = "Häufig gestellte Fragen",
  description = "Finden Sie Antworten auf die wichtigsten Fragen rund um ZunftGewerk.",
  supportEmail = "support@zunftgewerk.de",
  showSearch = true,
  showCategories = true,
  onOpenChange: onOpenChangeProp,
}: FaqDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<FaqCategory | "Alle">("Alle");
  const [openItem, setOpenItem] = useState<string | undefined>(undefined);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  const { recentSearches, rememberSearch, clearSearches } = useRecentSearches(open);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) setOpenItem(undefined);
    onOpenChangeProp?.(nextOpen);
  }

  const categories = useMemo(
    () => Array.from(new Set(ENTERPRISE_FAQS.map((faq) => faq.category))) as FaqCategory[],
    [],
  );

  const normalizedQuery = query.trim().toLowerCase();

  const categoryCounts = useMemo(() => {
    const counts = new Map<FaqCategory, number>();
    for (const category of categories) counts.set(category, 0);
    for (const faq of ENTERPRISE_FAQS) {
      counts.set(faq.category, (counts.get(faq.category) ?? 0) + 1);
    }
    return counts;
  }, [categories]);

  const filteredFaqs = useMemo(() => {
    return ENTERPRISE_FAQS.filter((faq) => {
      const categoryMatch = activeCategory === "Alle" || faq.category === activeCategory;
      const queryMatch =
        normalizedQuery.length === 0 ||
        faq.question.toLowerCase().includes(normalizedQuery) ||
        faq.answer.toLowerCase().includes(normalizedQuery);
      return categoryMatch && queryMatch;
    });
  }, [activeCategory, normalizedQuery]);

  const resolvedOpenItem =
    openItem && filteredFaqs.some((faq) => faq.id === openItem) ? openItem : undefined;
  const resultSummary = `${filteredFaqs.length} von ${ENTERPRISE_FAQS.length} Fragen`;

  // Cmd/Ctrl+K to focus search
  useEffect(() => {
    if (!open || !showSearch) return;
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [open, showSearch]);

  // Scroll open item into view
  useEffect(() => {
    if (!open || filteredFaqs.length === 0 || !resolvedOpenItem) return;
    const target = document.getElementById(`faq-item-${resolvedOpenItem}`);
    if (!target || !resultsContainerRef.current) return;
    target.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [open, resolvedOpenItem, filteredFaqs.length, normalizedQuery, activeCategory]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        data-faq-dialog
        className="flex max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden border-border/70 p-0 shadow-elevated sm:max-h-[calc(100dvh-2rem)] sm:w-full sm:max-w-3xl lg:max-w-4xl"
      >
        {/* Header */}
        <div className="bg-background/95 supports-backdrop-filter:bg-background/80 z-10 shrink-0 backdrop-blur-sm">
          <DialogHeader className="px-4 pt-3 pb-2.5 sm:px-5 sm:pt-4 sm:pb-3">
            <div className="flex items-start gap-2.5">
              <div className="bg-primary/10 ring-primary/20 mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset sm:h-10 sm:w-10">
                <HelpCircle className="text-primary h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="font-display text-base font-extrabold tracking-tight sm:text-lg">
                  {title}
                </DialogTitle>
                <DialogDescription className="mt-1 text-sm leading-snug">
                  {description}
                </DialogDescription>
                <p className="text-muted-foreground mt-1.5 text-xs" aria-live="polite">
                  {resultSummary}
                  {activeCategory !== "Alle" ? ` · Kategorie: ${activeCategory}` : ""}
                  {showSearch ? " · Shortcut: Cmd/Ctrl+K" : ""}
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Search & filters */}
          {(showSearch || showCategories) && (
            <div className="px-4 pb-2.5 sm:px-5">
              {showSearch && (
                <div className="relative">
                  <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                  <input
                    ref={searchInputRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") rememberSearch(query);
                    }}
                    onBlur={() => rememberSearch(query)}
                    type="search"
                    placeholder="Frage oder Stichwort suchen..."
                    className="border-border/70 bg-background ring-offset-background placeholder:text-muted-foreground/80 focus-visible:border-ring focus-visible:ring-ring/40 h-9 w-full rounded-md border py-1.5 pr-3 pl-9 text-sm outline-none focus-visible:ring-2"
                    aria-label="FAQ durchsuchen"
                  />
                </div>
              )}

              {showSearch && recentSearches.length > 0 && (
                <div className="mt-2.5 flex items-center gap-2 overflow-x-auto pb-0.5">
                  <span className="text-muted-foreground shrink-0 text-[11px] font-medium">
                    Zuletzt gesucht:
                  </span>
                  {recentSearches.map((term) => (
                    <Button
                      key={term}
                      type="button"
                      size="xs"
                      variant="outline"
                      className="shrink-0 rounded-full"
                      onClick={() => {
                        setQuery(term);
                        requestAnimationFrame(() => searchInputRef.current?.focus());
                      }}
                    >
                      {term}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    className="shrink-0"
                    onClick={clearSearches}
                  >
                    Verlauf löschen
                  </Button>
                </div>
              )}

              {showCategories && (
                <div className="mt-2.5 flex items-center gap-2 overflow-x-auto pb-0.5">
                  <Button
                    type="button"
                    size="xs"
                    variant={activeCategory === "Alle" ? "default" : "outline"}
                    className={`shrink-0 rounded-full transition-all ${activeCategory === "Alle" ? "shadow-sm shadow-primary/25" : ""}`}
                    onClick={() => setActiveCategory("Alle")}
                    aria-pressed={activeCategory === "Alle"}
                  >
                    Alle ({ENTERPRISE_FAQS.length})
                  </Button>
                  {categories.map((category) => (
                    <Button
                      key={category}
                      type="button"
                      size="xs"
                      variant={activeCategory === category ? "default" : "outline"}
                      className={`shrink-0 rounded-full transition-all ${activeCategory === category ? "shadow-sm shadow-primary/25" : ""}`}
                      onClick={() => setActiveCategory(category)}
                      aria-pressed={activeCategory === category}
                    >
                      {category} ({categoryCounts.get(category) ?? 0})
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          <Separator />
        </div>

        {/* FAQ list */}
        <div
          ref={resultsContainerRef}
          className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-5"
        >
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {resultSummary}
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center py-10 text-center">
              <p className="font-medium">Keine passenden Fragen gefunden</p>
              <p className="text-muted-foreground mt-2 max-w-md text-sm">
                Passen Sie den Suchbegriff an oder wählen Sie eine andere Kategorie.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setQuery("");
                  setActiveCategory("Alle");
                }}
              >
                Filter zurücksetzen
              </Button>
            </div>
          ) : (
            <Accordion
              type="single"
              collapsible
              value={resolvedOpenItem}
              onValueChange={(value) => setOpenItem(value || undefined)}
            >
              {filteredFaqs.map((faq) => (
                <AccordionItem key={faq.id} id={`faq-item-${faq.id}`} value={faq.id}>
                  <AccordionTrigger className="[&>svg]:text-muted-foreground min-h-12 py-2.5 text-left text-sm font-semibold hover:no-underline sm:text-base">
                    <span className="pr-3">{highlightText(faq.question, query)}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-3 text-sm leading-relaxed sm:text-[15px]">
                    {highlightText(faq.answer, query)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>

        {/* Footer */}
        <Separator />
        <DialogFooter className="bg-background/95 supports-backdrop-filter:bg-background/80 shrink-0 flex-row items-center justify-between px-4 py-2.5 backdrop-blur-sm sm:px-5 sm:py-3">
          <p className="text-muted-foreground pr-2 text-[11px] sm:text-xs">
            Weitere Fragen? Kontaktieren Sie unser{" "}
            <a
              href={`mailto:${supportEmail}`}
              className="text-primary font-medium underline-offset-4 hover:underline"
            >
              Support-Team
            </a>
          </p>
          <DialogClose asChild>
            <Button variant="outline" size="sm">
              Schließen
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

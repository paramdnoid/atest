"use client";

import { Button } from "@/components/ui/button";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Building2,
  Calculator,
  CalendarDays,
  Camera,
  Check,
  ClipboardCheck,
  Clock,
  FileCheck,
  FileOutput,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Gauge,
  Layers,
  type LucideIcon,
  MapPin,
  PackageSearch,
  Palette,
  PenLine,
  Pipette,
  Receipt,
  Route,
  Ruler,
  Scan,
  Shield,
  ShoppingCart,
  Smartphone,
  Thermometer,
  Users,
  Wrench,
} from "lucide-react";
import { type KeyboardEvent, useCallback, useRef, useState } from "react";

import { FadeIn } from "@/components/fade-in";
import { GlowBackground } from "@/components/glow-background";
import { GradientText } from "@/components/gradient-text";
import { SectionContainer } from "@/components/section-container";
import {
  secondaryTrades,
  type Trade,
  type TradeFeatureItem,
  trades,
} from "@/content/trades";
import { EASE_SMOOTH } from "@/lib/constants";

/* ── Icon registry ───────────────────────────────────────────────── */

const iconMap: Record<string, LucideIcon> = {
  BarChart3,
  BrainCircuit,
  Building2,
  Calculator,
  CalendarDays,
  Camera,
  ClipboardCheck,
  Clock,
  FileCheck,
  FileOutput,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Gauge,
  Layers,
  MapPin,
  PackageSearch,
  Palette,
  PenLine,
  Pipette,
  Receipt,
  Route,
  Ruler,
  Scan,
  Shield,
  ShoppingCart,
  Smartphone,
  Thermometer,
  Users,
  Wrench,
};

function FeatureIcon({ name }: { name: string }) {
  const Icon = iconMap[name];
  if (!Icon) return null;
  return <Icon className="h-4 w-4 text-primary" strokeWidth={1.8} aria-hidden="true" />;
}

/* ── Tab selector ────────────────────────────────────────────────── */

function TradeTabSelector({
  activeIndex,
  onSelect,
}: {
  activeIndex: number;
  onSelect: (i: number) => void;
}) {
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      let next = activeIndex;
      if (e.key === "ArrowRight") next = (activeIndex + 1) % trades.length;
      else if (e.key === "ArrowLeft")
        next = (activeIndex - 1 + trades.length) % trades.length;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = trades.length - 1;
      else return;

      e.preventDefault();
      onSelect(next);
      tabsRef.current[next]?.focus();
    },
    [activeIndex, onSelect]
  );

  return (
    <div
      role="tablist"
      aria-label="Gewerke"
      className="flex items-center gap-1 rounded-lg bg-muted/40 p-1"
      onKeyDown={handleKeyDown}
    >
      {trades.map((trade, i) => {
        const isActive = activeIndex === i;
        return (
          <button
            key={trade.slug}
            ref={(el) => {
              tabsRef.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`trades-tab-${trade.slug}`}
            tabIndex={isActive ? 0 : -1}
            aria-selected={isActive}
            aria-controls={`trades-panel-${trade.slug}`}
            aria-label={`${trade.name} (${i + 1} / ${trades.length})`}
            className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-2 text-[11px] font-medium transition-all duration-300 sm:px-3 sm:py-1.5 sm:text-xs ${
              isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => onSelect(i)}
          >
            {isActive && (
              <motion.div
                layoutId="trades-tab-bg"
                className="absolute inset-0 rounded-md bg-primary"
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
              />
            )}
            <trade.icon
              className="relative z-10 h-3 w-3"
              strokeWidth={isActive ? 2 : 1.5}
            />
            <span className="relative z-10">{trade.tabLabel}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Feature item ────────────────────────────────────────────────── */

function TradeFeature({ feature }: { feature: TradeFeatureItem }) {
  return (
    <div className="group flex items-start gap-3 rounded-xl p-3.5 transition-all duration-200 hover:bg-primary/4 sm:gap-4 sm:p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 ring-1 ring-primary/10 transition-colors duration-200 group-hover:bg-primary/12 group-hover:ring-primary/20">
        <FeatureIcon name={feature.icon} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-tight text-foreground">
          {feature.label}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground sm:text-[13px]">
          {feature.description}
        </p>
      </div>
    </div>
  );
}

/* ── Two-column trade content ────────────────────────────────────── */

function TradeContent({
  trade,
  activeIndex,
  onSelect,
}: {
  trade: Trade;
  activeIndex: number;
  onSelect: (i: number) => void;
}) {
  const prefersReduced = useReducedMotion();

  return (
    <div className="grid grid-cols-1 items-start gap-9 lg:grid-cols-[340px_1fr] lg:gap-0">
      {/* Left column: Trade info */}
      <div className="flex flex-col gap-5 lg:sticky lg:top-24 lg:pr-8">
        <TradeTabSelector activeIndex={activeIndex} onSelect={onSelect} />

        <div
          role="tabpanel"
          id={`trades-panel-${trade.slug}`}
          aria-labelledby={`trades-tab-${trade.slug}`}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={trade.slug}
              initial={prefersReduced ? false : { opacity: 0, x: -10 }}
              animate={prefersReduced ? {} : { opacity: 1, x: 0 }}
              exit={prefersReduced ? {} : { opacity: 0, x: 10 }}
              transition={{ duration: 0.25, ease: EASE_SMOOTH }}
              className="flex flex-col gap-5"
            >
              <div>
                {trade.highlight && (
                  <span className="mb-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary ring-1 ring-primary/20 ring-inset">
                    {trade.highlight}
                  </span>
                )}
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  {trade.description}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                {trade.stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p className="font-display text-lg font-bold text-primary">
                      {stat.value}
                    </p>
                    <p className="text-xs leading-tight text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Core features */}
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Immer inklusive
                </p>
                <ul className="space-y-1.5">
                  {trade.coreFeatures.map((f) => (
                    <li
                      key={f.label}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <Check
                        className="h-3 w-3 shrink-0 text-primary"
                        strokeWidth={2.5}
                      />
                      {f.label}
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <Button
                variant="gradient"
                size="sm"
                className="h-11 gap-2 shadow-md shadow-primary/25"
                asChild
              >
                <a href="#pricing">
                  Jetzt Testphase starten
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </Button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Right column: Feature grid */}
      <div className="lg:border-l lg:border-border/40 lg:pl-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={trade.slug}
            initial={prefersReduced ? false : { opacity: 0, y: 12 }}
            animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
            exit={prefersReduced ? {} : { opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: EASE_SMOOTH }}
          >
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground sm:mb-4">
              Branchenspezifisch
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {trade.tradeFeatures.map((f, i) => (
                <motion.div
                  key={f.label}
                  initial={prefersReduced ? false : { opacity: 0, y: 8 }}
                  animate={prefersReduced ? {} : { opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.25,
                    delay: prefersReduced ? 0 : i * 0.05,
                    ease: EASE_SMOOTH,
                  }}
                >
                  <TradeFeature feature={f} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Section export ──────────────────────────────────────────────── */

export function TradesSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeTrade = trades[activeIndex]!;

  return (
    <section
      id="trades"
      className="relative scroll-mt-40 overflow-hidden py-14 md:py-24"
      aria-labelledby="trades-heading"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-32 from-background to-transparent bg-linear-to-b" />
        <div className="absolute inset-x-0 bottom-0 h-32 from-background to-transparent bg-linear-to-t" />
      </div>
      <GlowBackground variant="subtle" />

      <SectionContainer className="relative">
        {/* Compact section header */}
        <FadeIn className="mx-auto mb-12 max-w-xl text-center md:mb-16">
          <h2
            id="trades-heading"
            className="hero-text-gloss font-display mb-3 text-[1.9rem] font-extrabold tracking-tight sm:text-3xl md:mb-4 md:text-4xl lg:text-5xl"
          >
            Für Ihr Gewerk <GradientText>optimiert</GradientText>
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed text-balance sm:text-lg">
            Branchenspezifische Funktionen, die genau auf Ihre Anforderungen zugeschnitten
            sind.
          </p>
        </FadeIn>

        {/* Two-column trade content */}
        <FadeIn delay={0.1}>
          <TradeContent
            trade={activeTrade}
            activeIndex={activeIndex}
            onSelect={setActiveIndex}
          />
        </FadeIn>

        {/* Secondary trades */}
        <FadeIn delay={0.2}>
          <div className="mt-14 border-t border-border/30 pt-8 sm:mt-20 sm:pt-10">
            <p className="mb-5 text-center text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">
              Weitere Gewerke
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {secondaryTrades.map((t) => (
                <div
                  key={t.name}
                  className="flex items-center gap-2 rounded-full border border-border/40 bg-muted/20 px-4 py-2 text-sm text-muted-foreground"
                >
                  <t.icon className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
                  {t.name}
                  {t.comingSoon && (
                    <span className="rounded bg-muted/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                      Bald
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </SectionContainer>
    </section>
  );
}

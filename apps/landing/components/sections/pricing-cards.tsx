"use client";

import { Button } from "@/components/ui/button";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Minus } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { useAnimatedNumber } from "@/hooks/use-animated-number";

import { StaggerChildren, StaggerItem } from "@/components/fade-in";

export interface PublicPlan {
  tier: string;
  name: string;
  description: string | null;
  priceMonthly: number;
  priceYearly: number | null;
  trialDays: number;
  isPopular: boolean;
  ctaText: string | null;
  ctaLink: string | null;
  features: { label: string }[];
}

function formatPrice(
  cents: number,
  yearly: boolean
): { display: string; amount: number | null; suffix: string | null } {
  if (cents === 0) return { display: "Kostenlos", amount: null, suffix: null };
  if (cents < 0) return { display: "Individuell", amount: null, suffix: null };
  const amount = Math.round(cents / 100);
  return {
    display: `€${amount}`,
    amount,
    suffix: yearly ? "/ Monat, jährl. abgerechnet" : "/ Monat",
  };
}

function savingsPercent(monthly: number, yearly: number): number {
  const monthlyTotal = monthly * 12;
  if (monthlyTotal <= 0) return 0;
  return Math.round(((monthlyTotal - yearly) / monthlyTotal) * 100);
}

function BillingToggle({
  yearly,
  onToggle,
  maxSavings,
}: {
  yearly: boolean;
  onToggle: () => void;
  maxSavings: number;
}) {
  return (
    <div className="mx-auto mb-6 flex items-center justify-center px-2 sm:mb-8">
      <div className="premium-panel inline-flex max-w-full flex-wrap items-center justify-center gap-1 rounded-lg p-1 backdrop-blur-sm">
        <button
          type="button"
          aria-pressed={!yearly}
          onClick={() => yearly && onToggle()}
          className={`relative rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 sm:px-5 ${
            !yearly
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Monatlich
        </button>
        <button
          type="button"
          aria-pressed={yearly}
          aria-label="Jährliche Abrechnung"
          onClick={() => !yearly && onToggle()}
          className={`relative flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 sm:px-5 ${
            yearly
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Jährlich
        </button>
        {maxSavings > 0 && (
          <span className="rounded-md bg-emerald-500 px-2 py-1 text-[11px] font-bold text-white">
            -{maxSavings}%
          </span>
        )}
      </div>
    </div>
  );
}

function AnimatedPrice({
  amount,
  yearly,
  accent,
  monthlyAmount,
}: {
  amount: number;
  yearly: boolean;
  accent: boolean;
  monthlyAmount: number | null;
}) {
  const shown = useAnimatedNumber(amount, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.5,
  });

  const showStrikethrough = yearly && monthlyAmount != null && monthlyAmount !== amount;

  return (
    <div className="flex items-baseline gap-2">
      {showStrikethrough && (
        <span className="text-base font-medium text-muted-foreground/40 line-through decoration-muted-foreground/30">
          €{monthlyAmount}
        </span>
      )}
      <span
        className={`font-display text-3xl font-extrabold tracking-tight sm:text-4xl ${
          accent ? "text-primary" : "text-foreground"
        }`}
      >
        €{shown}
      </span>
    </div>
  );
}

function FeatureList({
  features,
  accent,
  previousTierName,
}: {
  features: { label: string }[];
  accent: boolean;
  previousTierName?: string;
}) {
  const ref = useRef<HTMLUListElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const prefersReduced = useReducedMotion();

  return (
    <ul ref={ref} className="space-y-2.5">
      {previousTierName && (
        <li className="flex items-center gap-2.5 pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
          <Minus className="h-3 w-3 shrink-0" strokeWidth={2} />
          Alles aus {previousTierName}
        </li>
      )}
      {features.map((feature, i) => {
        const item = (
          <>
            <div
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                accent ? "bg-primary text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              <Check className="h-2.5 w-2.5" strokeWidth={3} />
            </div>
            <span className="text-sm leading-relaxed text-foreground/80">
              {feature.label}
            </span>
          </>
        );

        if (prefersReduced === true) {
          return (
            <li key={feature.label} className="flex items-start gap-2.5">
              {item}
            </li>
          );
        }

        return (
          <motion.li
            key={feature.label}
            className="flex items-start gap-2.5"
            initial={{ opacity: 0, x: -8 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
          >
            {item}
          </motion.li>
        );
      })}
    </ul>
  );
}

function PricingCard({
  plan,
  yearly,
  previousTierName,
}: {
  plan: PublicPlan;
  yearly: boolean;
  previousTierName?: string;
}) {
  const isPopular = plan.isPopular;
  const ctaHref = plan.ctaLink ?? "/auth/register";
  const authTemporarilyDisabled = ctaHref.startsWith("/auth/");
  const effectivePrice =
    yearly && plan.priceYearly != null && plan.priceYearly > 0
      ? Math.round(plan.priceYearly / 12)
      : plan.priceMonthly;

  const { display, amount, suffix } = formatPrice(effectivePrice, yearly);
  const monthlyPrice = formatPrice(plan.priceMonthly, false);

  const savings =
    yearly && plan.priceYearly != null && plan.priceYearly > 0
      ? savingsPercent(plan.priceMonthly, plan.priceYearly)
      : 0;

  return (
    <div
      className={`relative flex h-full flex-col rounded-2xl border p-4 transition-all duration-300 sm:p-5 ${
        isPopular
          ? "premium-panel-strong border-primary/30 hover:-translate-y-1 hover:shadow-xl"
          : "premium-panel border-border/60 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_24px_46px_-24px_rgba(2,6,23,0.42)]"
      }`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1 text-[10px] font-semibold tracking-[0.12em] uppercase text-white shadow-sm shadow-primary/30">
            Beliebtester Plan
          </span>
        </div>
      )}

      <div className={isPopular ? "pt-2" : ""}>
        <h3 className="font-display text-lg font-bold tracking-[0.02em]">{plan.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          {plan.description}
        </p>
      </div>

      <div className="mt-5 mb-5">
        {amount != null ? (
          <div>
            <AnimatedPrice
              amount={amount}
              yearly={yearly}
              accent={isPopular}
              monthlyAmount={yearly ? monthlyPrice.amount : null}
            />
            <span className="mt-1 block text-sm text-muted-foreground">{suffix}</span>
          </div>
        ) : (
          <div>
            <span
              className={`font-display font-bold tracking-tight ${
                effectivePrice === 0
                  ? "text-4xl font-extrabold text-foreground"
                  : "text-2xl italic text-muted-foreground"
              }`}
            >
              {display}
            </span>
            {plan.trialDays > 0 && (
              <span className="mt-1 block text-sm font-medium text-primary">
                {plan.trialDays} Tage kostenlos testen
              </span>
            )}
          </div>
        )}

        {savings > 0 && yearly && (
          <span className="mt-2 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400">
            {savings}% günstiger
          </span>
        )}
      </div>

      <div className="mb-5 h-px bg-border/50" />

      <div className="flex-1">
        <FeatureList
          features={plan.features}
          accent={isPopular}
          previousTierName={previousTierName}
        />
      </div>

      <div className="mt-6">
        {isPopular ? (
          authTemporarilyDisabled ? (
            <Button
              className="w-full bg-primary text-xs font-semibold tracking-[0.04em] uppercase text-white shadow-sm shadow-primary/25 opacity-70 sm:text-sm sm:tracking-[0.08em]"
              size="lg"
              disabled
              title="Vorübergehend deaktiviert"
            >
              {plan.ctaText ?? "Jetzt starten"}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          ) : (
            <Button
              className="w-full bg-primary text-xs font-semibold tracking-[0.04em] uppercase text-white shadow-sm shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-md hover:shadow-primary/35 sm:text-sm sm:tracking-[0.08em]"
              size="lg"
              asChild
            >
              <Link href={ctaHref}>
                {plan.ctaText ?? "Jetzt starten"}
                <ArrowRight className="ml-1.5 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </Button>
          )
        ) : authTemporarilyDisabled ? (
          <Button
            className="w-full border-border/70 text-xs font-semibold tracking-[0.04em] uppercase opacity-70 sm:text-sm sm:tracking-[0.08em]"
            variant="outline"
            size="lg"
            disabled
            title="Vorübergehend deaktiviert"
          >
            {plan.ctaText ?? "Auswählen"}
          </Button>
        ) : (
          <Button
            className="w-full border-border/70 text-xs font-semibold tracking-[0.04em] uppercase transition-all hover:border-foreground/20 sm:text-sm sm:tracking-[0.08em]"
            variant="outline"
            size="lg"
            asChild
          >
            <Link href={ctaHref}>{plan.ctaText ?? "Auswählen"}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

export function PricingCards({
  plans,
  hasYearlyOption,
}: {
  plans: PublicPlan[];
  hasYearlyOption: boolean;
}) {
  const [yearly, setYearly] = useState(false);

  const maxSavings = plans.reduce((max, p) => {
    if (p.priceYearly != null && p.priceYearly > 0 && p.priceMonthly > 0) {
      return Math.max(max, savingsPercent(p.priceMonthly, p.priceYearly));
    }
    return max;
  }, 0);

  const regularPlans = plans.filter((p) => p.priceMonthly >= 0);

  return (
    <>
      {hasYearlyOption && (
        <BillingToggle
          yearly={yearly}
          onToggle={() => setYearly((y) => !y)}
          maxSavings={maxSavings}
        />
      )}

      <StaggerChildren
        className="mx-auto grid max-w-5xl items-stretch gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3"
        staggerDelay={0.1}
      >
        {regularPlans.map((plan, i) => (
          <StaggerItem key={plan.tier}>
            <PricingCard
              plan={plan}
              yearly={yearly}
              previousTierName={i > 0 ? regularPlans[i - 1]!.name : undefined}
            />
          </StaggerItem>
        ))}
      </StaggerChildren>
    </>
  );
}

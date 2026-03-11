import { FadeIn } from "@/components/fade-in";
import { GlowBackground } from "@/components/glow-background";
import { GradientText } from "@/components/gradient-text";
import { SectionContainer } from "@/components/section-container";

import { PricingCards, type PublicPlan } from "./pricing-cards";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const ALLOWED_PLAN_CODES = new Set(["starter", "professional"]);

// Shape returned by GET /v1/plans
type ApiPlan = {
  planId: string;
  displayName: string;
  description?: string | null;
  maxDevices?: number | null;
  billingCycle?: string | null;
  amountCents?: number | null;
  amountCentsYearly?: number | null;
  trialDays?: number | null;
  isPopular?: boolean | null;
  ctaText?: string | null;
  features?: string[] | null;
};

const STATIC_PLANS: PublicPlan[] = [
  {
    tier: "starter",
    name: "Starter",
    description: "Für kleine Teams mit professionellen Anforderungen.",
    priceMonthly: 19900,
    priceYearly: 214920,
    trialDays: 30,
    isPopular: true,
    ctaText: "Plan wählen",
    ctaLink: "/onboarding?plan=starter",
    features: [
      { label: "Max. 5 Benutzer" },
      { label: "10 GB Speicher" },
      { label: "5 Lizenzen" },
      { label: "30 Tage Testphase" },
      { label: "Mobile App" },
      { label: "Desktop App" },
      { label: "DSGVO-konform" },
      { label: "Starke Datenverschlüsselung" },
      { label: "Abrechnung startet nach Trial-Ende" },
    ],
  },
  {
    tier: "professional",
    name: "Professional",
    description:
      "Für wachsende Betriebe mit erweiterten Anforderungen und mehr Team.",
    priceMonthly: 39900,
    priceYearly: 430920,
    trialDays: 30,
    isPopular: false,
    ctaText: "Plan wählen",
    ctaLink: "/onboarding?plan=professional",
    features: [
      { label: "Max. 10 Benutzer" },
      { label: "50 GB Speicher" },
      { label: "10 Lizenzen" },
      { label: "30 Tage Testphase" },
      { label: "Mobile App" },
      { label: "Desktop App" },
      { label: "DSGVO-konform" },
      { label: "Starke Datenverschlüsselung" },
      { label: "Abrechnung startet nach Trial-Ende" },
      { label: "DATEV-Schnittstelle" },
      { label: "GAEB-Schnittstelle" },
    ],
  },
];

function mapApiPlanToPublicPlan(api: ApiPlan): PublicPlan {
  const tier = api.planId;
  const staticFallback = STATIC_PLANS.find((p) => p.tier === tier);
  return {
    tier,
    name: api.displayName,
    description: api.description ?? staticFallback?.description ?? null,
    priceMonthly: api.amountCents ?? 0,
    priceYearly: api.amountCentsYearly ?? staticFallback?.priceYearly ?? null,
    trialDays: api.trialDays ?? 30,
    isPopular: api.isPopular ?? staticFallback?.isPopular ?? false,
    ctaText: api.ctaText ?? staticFallback?.ctaText ?? "Plan wählen",
    ctaLink: `/onboarding?plan=${tier}`,
    features:
      api.features && api.features.length > 0
        ? api.features.map((f) => ({ label: f }))
        : (staticFallback?.features ?? []),
  };
}

async function fetchPlans(): Promise<PublicPlan[]> {
  try {
    const res = await fetch(`${API_URL}/v1/plans`, {
      next: { revalidate: 300 }, // revalidate every 5 minutes
    });
    if (!res.ok) return STATIC_PLANS;
    const data: ApiPlan[] = await res.json();
    if (!Array.isArray(data) || data.length === 0) return STATIC_PLANS;
    const supportedPlans = data.filter((plan) =>
      ALLOWED_PLAN_CODES.has(plan.planId.toLowerCase()),
    );
    if (supportedPlans.length === 0) return STATIC_PLANS;
    return supportedPlans.map(mapApiPlanToPublicPlan);
  } catch {
    return STATIC_PLANS;
  }
}

export async function PricingSection() {
  const plans = await fetchPlans();
  const hasYearly = plans.some(
    (p) => p.priceYearly != null && p.priceYearly > 0
  );

  return (
    <section
      id="pricing"
      className="premium-noise bg-muted/15 relative scroll-mt-12 overflow-x-clip py-10 sm:py-12 md:py-10 lg:py-14"
      aria-labelledby="pricing-heading"
    >
      <div aria-hidden="true" className="enterprise-grid pointer-events-none absolute inset-0 opacity-70" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 from-background to-transparent bg-linear-to-b sm:h-32"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 from-background to-transparent bg-linear-to-t sm:h-32"
      />
      <div
        className="bg-dot-pattern absolute inset-0 opacity-[0.12]"
        aria-hidden="true"
      />
      <GlowBackground variant="subtle" />

      <SectionContainer className="relative z-20">
        <FadeIn className="mx-auto mb-7 max-w-2xl text-center sm:mb-8 md:mb-9">
          <h2
            id="pricing-heading"
            className="hero-text-gloss font-display mb-3 text-[1.9rem] font-bold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl"
          >
            Planungssicher.
            <br />
            <GradientText>Skalierbar.</GradientText>
          </h2>
          <p className="text-muted-foreground text-base leading-[1.68] text-pretty sm:text-base md:text-lg">
            Transparente Pakete für kleine Teams bis wachsende Betriebe mit klaren
            Leistungsgrenzen und ohne versteckte Zusatzkosten.
          </p>
          <div aria-hidden="true" className="premium-divider mx-auto mt-4 w-56" />
        </FadeIn>

        <PricingCards plans={plans} hasYearlyOption={hasYearly} />

        <FadeIn delay={0.3}>
          <p className="text-muted-foreground mt-8 text-center text-sm">
            Alle Preise zzgl. MwSt. · 30 Tage Testphase · Zahlung startet automatisch nach Trial-Ende
          </p>
        </FadeIn>
      </SectionContainer>
    </section>
  );
}

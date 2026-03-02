import { FadeIn } from "@/components/fade-in";
import { GlowBackground } from "@/components/glow-background";
import { GradientText } from "@/components/gradient-text";
import { SectionContainer } from "@/components/section-container";

import { PricingCards, type PublicPlan } from "./pricing-cards";

const staticPlans: PublicPlan[] = [
  {
    tier: "free",
    name: "Free",
    description:
      "Kostenloser Einstieg mit Basisfunktionen – keine Kreditkarte nötig.",
    priceMonthly: 0,
    priceYearly: null,
    trialDays: 30,
    isPopular: false,
    ctaText: "Kostenlos starten",
    ctaLink: "/onboarding?plan=free",
    features: [
      { label: "Max. 5 Benutzer" },
      { label: "1 GB Speicher" },
      { label: "2 Lizenzen" },
      { label: "30 Tage kostenlos testen" },
      { label: "Mobile App" },
      { label: "Desktop App" },
      { label: "DSGVO-konform" },
      { label: "Starke Datenverschlüsselung" },
      { label: "Keine Kreditkarte nötig" },
    ],
  },
  {
    tier: "starter",
    name: "Starter",
    description:
      "Für kleine Teams mit professionellen Anforderungen.",
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
      { label: "30 Tage kostenlos testen" },
      { label: "Mobile App" },
      { label: "Desktop App" },
      { label: "DSGVO-konform" },
      { label: "Starke Datenverschlüsselung" },
      { label: "Keine Kreditkarte nötig" },
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
      { label: "30 Tage kostenlos testen" },
      { label: "Mobile App" },
      { label: "Desktop App" },
      { label: "DSGVO-konform" },
      { label: "Starke Datenverschlüsselung" },
      { label: "Keine Kreditkarte nötig" },
      { label: "DATEV-Schnittstelle" },
      { label: "GAEB-Schnittstelle" },
    ],
  },
];

export function PricingSection() {
  const hasYearly = staticPlans.some(
    (p) => p.priceYearly != null && p.priceYearly > 0
  );

  return (
    <section
      id="pricing"
      className="premium-noise bg-muted/15 relative scroll-mt-12 overflow-x-clip py-6 md:py-10 lg:py-14"
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
        <FadeIn className="mx-auto mb-8 max-w-2xl text-center md:mb-9">
          <h2
            id="pricing-heading"
            className="hero-text-gloss font-display mb-3 text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl lg:text-5xl"
          >
            Planungssicher.
            <br />
            <GradientText>Skalierbar.</GradientText>
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed text-pretty sm:text-base md:text-lg">
            Transparente Pakete für kleine Teams bis wachsende Betriebe mit klaren
            Leistungsgrenzen und ohne versteckte Zusatzkosten.
          </p>
          <div aria-hidden="true" className="premium-divider mx-auto mt-4 w-56" />
        </FadeIn>

        <PricingCards plans={staticPlans} hasYearlyOption={hasYearly} />

        <FadeIn delay={0.3}>
          <p className="text-muted-foreground mt-8 text-center text-sm">
            Alle Preise zzgl. MwSt. · 30 Tage kostenlos testen · Keine Kreditkarte
            erforderlich
          </p>
        </FadeIn>
      </SectionContainer>
    </section>
  );
}

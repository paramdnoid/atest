import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Server,
  ShieldCheck,
  Timer,
} from "lucide-react";
import Link from "next/link";

import { FadeIn, StaggerChildren, StaggerItem } from "@/components/fade-in";
import { GlowBackground } from "@/components/glow-background";
import { GradientCta } from "@/components/gradient-cta";
import { GradientText } from "@/components/gradient-text";
import { SectionContainer } from "@/components/section-container";

const trustItems = [
  { icon: ShieldCheck, text: "AES-256-GCM Verschlüsselung" },
  { icon: Server, text: "Hosting in Deutschland" },
  { icon: CreditCard, text: "Keine Kreditkarte nötig" },
  { icon: Timer, text: "In 2 Minuten startklar" },
];

export function CtaSection() {
  return (
    <section
      className="relative overflow-hidden py-24 md:py-32"
      aria-labelledby="cta-heading"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="from-primary/5 absolute inset-0 bg-linear-to-br via-transparent to-primary/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklch,var(--color-primary)_8%,transparent)_0%,transparent_70%)]" />
        <div className="absolute inset-x-0 bottom-0 h-32 from-muted/30 to-transparent bg-linear-to-t" />
      </div>
      <GlowBackground variant="centered" />

      <SectionContainer width="narrow" className="text-center">
        <FadeIn delay={0.1}>
          <p className="text-primary mb-4 text-xs font-bold tracking-[0.15em] uppercase">Jetzt durchstarten</p>
          <h2
            id="cta-heading"
            className="hero-text-gloss font-display mb-6 text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl"
          >
            Bereit, Ihren Betrieb zu{" "}
            <GradientText>digitalisieren</GradientText>?
          </h2>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="text-muted-foreground mx-auto mb-10 max-w-2xl text-lg text-balance">
            Starten Sie noch heute mit ZunftGewerk — 30 Tage kostenlos,
            ohne Risiko. Ihre sensiblen Kunden- und Betriebsdaten werden
            bei uns verschlüsselt gespeichert.
          </p>
        </FadeIn>

        <FadeIn delay={0.3}>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <GradientCta href="/onboarding">
              Kostenlos testen
            </GradientCta>
            <Button
              size="lg"
              variant="outline"
              className="h-13 w-full px-8 text-base font-medium sm:w-auto"
              asChild
            >
              <Link href="mailto:sales@zunftgewerk.de">
                Beratungsgespräch buchen
              </Link>
            </Button>
          </div>
        </FadeIn>

        {/* Trust badges */}
        <StaggerChildren
          className="mt-12 flex flex-wrap items-center justify-center gap-3"
          delay={0.4}
          staggerDelay={0.06}
        >
          {trustItems.map((item) => (
            <StaggerItem key={item.text}>
              <Badge
                variant="secondary"
                className="border-border/60 bg-background/60 text-muted-foreground gap-2 border px-4 py-2 text-[13px] font-medium backdrop-blur-sm"
              >
                <item.icon className="text-primary size-3.5" aria-hidden="true" />
                {item.text}
              </Badge>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </SectionContainer>
    </section>
  );
}

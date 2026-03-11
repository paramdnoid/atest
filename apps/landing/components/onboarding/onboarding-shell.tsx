import { ShieldCheck } from "lucide-react";

import { FadeIn } from "@/components/fade-in";
import { GlowBackground } from "@/components/glow-background";
import { SectionBadge } from "@/components/section-badge";
import { SectionContainer } from "@/components/section-container";

export function OnboardingShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="premium-noise relative overflow-hidden py-6 sm:py-10">
      <div aria-hidden className="enterprise-grid pointer-events-none absolute inset-0 opacity-45" />
      <div aria-hidden className="bg-dot-pattern pointer-events-none absolute inset-0 opacity-[0.07]" />
      <GlowBackground variant="subtle" />
      <SectionContainer as="main" className="relative max-w-6xl">
        <FadeIn className="mx-auto mb-5 max-w-3xl text-center sm:mb-7">
          <SectionBadge icon={ShieldCheck}>Onboarding</SectionBadge>
          <h1 className="hero-text-gloss font-display text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            Zugriff aufbauen.
            <br />
            Betrieb aktivieren.
          </h1>
          <p className="text-muted-foreground mx-auto mt-3 max-w-2xl text-sm leading-relaxed">
            Planwahl, Konto und Verifikation laufen in einem geführten Flow. Deine Testphase startet
            direkt nach der Registrierung, die Abrechnung beginnt erst nach Trial-Ende.
          </p>
        </FadeIn>

        {children}
      </SectionContainer>
    </section>
  );
}

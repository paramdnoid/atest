"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { FadeIn } from "@/components/fade-in";
import { FeaturesSceneWrapper } from "@/components/features-scene";
import { GlowBackground } from "@/components/glow-background";
import { GradientText } from "@/components/gradient-text";
import { SectionBadge } from "@/components/section-badge";
import { SectionContainer } from "@/components/section-container";
import { EASE_SMOOTH } from "@/lib/constants";

import { Features3DCarousel } from "./features-carousel";
import { StaticGrid } from "./static-grid";

export function FeaturesSection() {
  const prefersReduced = useReducedMotion();

  return (
    <section
      id="features"
      className="premium-noise bg-muted/20 relative scroll-mt-32 overflow-x-clip py-14 md:py-10 lg:py-12"
      aria-labelledby="features-heading"
    >

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-40 from-background to-transparent bg-linear-to-b sm:h-56"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40 from-background to-transparent bg-linear-to-t sm:h-56"
      />

      <FeaturesSceneWrapper />

      <div className="bg-dot-pattern absolute inset-0 opacity-20" aria-hidden="true" />
      <GlowBackground />
      <SectionContainer className="relative z-20">
        <FadeIn className="mx-auto mb-10 max-w-2xl text-center md:mb-10 lg:mb-12">
          <SectionBadge icon={Sparkles}>Funktionen</SectionBadge>
          <h2
            id="features-heading"
            className="hero-text-gloss font-display mb-3 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl"
          >
            Operative Exzellenz
            <br />
            <GradientText>in einem System</GradientText>
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed text-pretty md:text-lg">
            Von Disposition bis Dokumentation: Alle Kernprozesse greifen nahtlos ineinander
            und halten Ihr Team auch unterwegs produktiv.
          </p>
          {prefersReduced !== false ? (
            <div aria-hidden="true" className="premium-divider mx-auto mt-4 w-56" />
          ) : (
            <motion.div
              aria-hidden="true"
              className="premium-divider mx-auto mt-4 w-56 origin-center"
              initial={{ scaleX: 0, opacity: 0 }}
              whileInView={{ scaleX: 1, opacity: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8, delay: 0.3, ease: EASE_SMOOTH }}
            />
          )}
        </FadeIn>

        {prefersReduced !== false ? <StaticGrid /> : <Features3DCarousel />}
      </SectionContainer>
    </section>
  );
}

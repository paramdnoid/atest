"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, useReducedMotion } from "framer-motion";
import {
  ChevronDown,
  HeartHandshake,
  LockKeyhole,
  Play,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { FadeIn } from "@/components/fade-in";
import { GlowBackground } from "@/components/glow-background";
import { GradientCta } from "@/components/gradient-cta";
import { GradientText } from "@/components/gradient-text";
import { HeroSceneWrapper } from "@/components/hero-scene-wrapper";
import { SectionContainer } from "@/components/section-container";
import { partners } from "@/content/partners";

export function HeroSection() {
  const prefersReduced = useReducedMotion();

  return (
    <section
      className="relative min-h-screen overflow-x-clip overflow-y-hidden"
      aria-labelledby="hero-heading"
    >
      <HeroSceneWrapper />

      <GlowBackground />

      <SectionContainer className="flex min-h-screen flex-col items-center justify-center pt-24 pb-14 sm:pb-20">
        <div className="grid w-full items-center gap-8 sm:gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-8 xl:gap-12">
          <div className="relative z-30 text-center lg:pr-2 lg:text-left xl:pr-4">
            <FadeIn delay={0.1} duration={0.5}>
              <Badge
                variant="secondary"
                className="enterprise-kicker text-foreground mb-6 inline-flex max-w-full gap-2 border px-3 py-1.5 text-[10px] font-semibold tracking-[0.08em] uppercase backdrop-blur-sm sm:mb-8 sm:px-5 sm:py-2 sm:text-[11px] sm:tracking-[0.12em]"
              >
                <Sparkles className="text-primary h-3.5 w-3.5" />
                Für Kaminfeger, Maler & SHK-Betriebe
              </Badge>
            </FadeIn>

            <FadeIn delay={0.2} duration={0.7}>
              <h1
                id="hero-heading"
                className="hero-text-gloss hero-title-brutal mb-5 text-[1.7rem] text-pretty sm:text-[2.2rem] md:text-[2.55rem] lg:mb-6 lg:max-w-none lg:text-[2.95rem] xl:text-[3.35rem]"
              >
                <span className="block">Die Handwerker</span>
                <span className="block">
                  Software, <GradientText>die mitdenkt</GradientText>
                </span>
              </h1>
            </FadeIn>

            <FadeIn delay={0.35} duration={0.6}>
              <p className="hero-subtext mx-auto mb-8 text-[0.95rem] leading-relaxed text-pretty sm:text-[1rem] md:text-[0.98rem] lg:mb-10 lg:mx-0">
                Skalieren Sie Abläufe von Einsatzplanung bis Faktura mit einer Oberfläche,
                die für produktive Teams in kritischen Betriebsabläufen gebaut ist.
              </p>
            </FadeIn>

            <FadeIn delay={0.5} duration={0.5}>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
                <GradientCta href="/onboarding" className="text-[0.95rem]">
                  30 Tage kostenlos testen
                </GradientCta>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-13 w-full gap-2 border-foreground/20 px-8 text-[0.95rem] font-medium backdrop-blur-sm transition-all hover:border-foreground/40 sm:w-auto"
                  asChild
                >
                  <Link href="#trades">
                    <Play className="h-4 w-4" />
                    Funktionen entdecken
                  </Link>
                </Button>
              </div>
            </FadeIn>

            <FadeIn delay={0.65} duration={0.5}>
              <div className="text-muted-foreground mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-3 text-[10px] font-medium tracking-[0.04em] uppercase sm:mt-10 sm:gap-x-3 sm:gap-y-4 sm:text-[11px] sm:tracking-[0.06em] lg:justify-start">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="text-primary h-4 w-4" />
                  DSGVO-konform
                </span>
                <span className="text-border" aria-hidden="true">
                  |
                </span>
                <span className="flex items-center gap-2">
                  <LockKeyhole className="text-primary h-4 w-4" />
                  Starke Datenverschlüsselung
                </span>
                <span className="text-border" aria-hidden="true">
                  |
                </span>
                <span className="flex items-center gap-2">
                  <Zap className="text-primary h-4 w-4" />
                  Keine Kreditkarte nötig
                </span>
                <span className="text-border" aria-hidden="true">
                  |
                </span>
                <span className="flex items-center gap-2">
                  <HeartHandshake className="text-primary h-4 w-4" />
                  Persönlicher Support
                </span>
              </div>
            </FadeIn>

            <FadeIn delay={0.78} duration={0.55}>
              <div className="mt-6 grid max-w-xl gap-3 sm:mt-7 sm:grid-cols-2">
                <div className="premium-panel animate-panel-enter rounded-xl px-4 py-3 text-left">
                  <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.12em] uppercase">
                    Plattform-Tempo
                  </p>
                  <p className="font-display mt-1 text-[1.35rem] font-bold tracking-tight">60%</p>
                  <p className="text-muted-foreground text-[11px]">weniger Admin-Aufwand im Büroalltag</p>
                </div>
                <div className="premium-panel animate-panel-enter rounded-xl px-4 py-3 text-left [animation-delay:120ms]">
                  <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.12em] uppercase">
                    Datenkontrolle
                  </p>
                  <p className="font-display mt-1 text-[1.35rem] font-bold tracking-tight">100%</p>
                  <p className="text-muted-foreground text-[11px]">verschlüsselte Speicherung sensibler Daten</p>
                </div>
              </div>
            </FadeIn>
          </div>

          <FadeIn delay={0.5} duration={0.7} direction="left">
            <motion.div
              className="relative mx-auto mt-6 w-full max-w-[calc(100vw-2rem)] perspective-[520px] sm:mt-8 sm:max-w-xl sm:perspective-[600px] lg:mt-0 lg:ml-auto lg:max-w-[min(58vw,52rem)] lg:origin-center xl:max-w-[min(56vw,56rem)]"
              initial={prefersReduced !== false ? false : { opacity: 0, y: 36, scale: 0.97 }}
              animate={prefersReduced !== false ? {} : { opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="group relative transform-none transition-transform duration-700 ease-out sm:transform-[rotateY(-14deg)_rotateX(5deg)] hover:sm:transform-[rotateY(-4deg)_rotateX(2deg)]">
                <div className="border-border/50 from-muted/50 to-muted/20 shadow-elevated overflow-hidden rounded-xl border bg-linear-to-b p-1 transform-3d">
                  <Image
                    src="/desktop-light.jpeg"
                    alt="Zunftgewerk Dashboard-Vorschau mit Auftragsübersicht, Kalender und Kundenverwaltung"
                    width={1920}
                    height={1080}
                    priority
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAoHBwgHBgoICAgLCgoLDhgQDg0NDh0VFhEYIx8lJCIfIiEmKzcvJik0KSEiMEExNDk7Pj4+JS5ESUM8SDc9Pjv/2wBDAQoLCw4NDhwQEBw7KCIoOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozv/wAARCAAIABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAACP/EAB8QAAIBBAIDAAAAAAAAAAAAAAABAgMEBREhEjFBUf/EABUBAQEAAAAAAAAAAAAAAAAAAAUG/8QAGhEAAgMBAQAAAAAAAAAAAAAAAQIAAxEhQf/aAAwDAQACEQMRAD8AloW1xi8e7vZ7aVSMVyoRbS+voA8qUOT2z2FKtwzCnqf/2Q=="
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 60vw, 700px"
                    className="rounded-lg saturate-[1.06]"
                  />
                </div>
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 -left-px w-px bg-linear-to-b from-transparent via-white/25 to-transparent"
                />
              </div>
              <div
                aria-hidden="true"
                className="from-primary/10 absolute -inset-4 -z-10 translate-x-2 translate-y-2 rounded-2xl bg-linear-to-r via-primary/5 to-transparent blur-2xl"
              />
              <div
                aria-hidden="true"
                className="bg-primary/5 absolute inset-x-8 -bottom-8 -z-10 h-16 rounded-full blur-2xl"
              />
              <div className="premium-panel absolute right-0 -bottom-3 z-30 hidden rounded-lg px-3 py-2 text-left shadow-xl transform-3d transform-[rotateY(-14deg)_rotateX(5deg)_translateZ(30px)] md:block md:right-2 md:-bottom-6 md:px-4 md:py-3 lg:right-4 xl:right-0">
                <p className="text-muted-foreground text-[10px] font-semibold tracking-[0.12em] uppercase">
                  Live-Status
                </p>
                <p className="font-display text-foreground mt-1 text-[1.1rem] font-bold">Multi-Geräte-Sync</p>
                <p className="text-muted-foreground text-[11px]">Desktop, Tablet & Smartphone in Echtzeit</p>
              </div>
            </motion.div>
          </FadeIn>
        </div>
      </SectionContainer>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-36 bg-linear-to-t from-background via-background/72 to-transparent sm:h-10"
      />

      <div className="absolute bottom-6 left-1/2 z-20 hidden -translate-x-1/2 animate-bounce repeat-3 md:block">
        <a
          href="#trades"
          className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          aria-label="Nach unten scrollen"
        >
          <ChevronDown className="h-5 w-5" />
        </a>
      </div>
    </section>
  );
}

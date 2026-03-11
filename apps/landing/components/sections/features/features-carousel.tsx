"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { EllipseCard, EllipseCarousel } from "@/components/ellipse-carousel";
import { FadeIn } from "@/components/fade-in";
import { features } from "@/content/features";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useEllipseCarousel } from "@/hooks/use-ellipse-carousel";

import { FeatureCardContent } from "./feature-card-content";
import { FeatureDetailPanel } from "./feature-detail-panel";
import { FeatureNav } from "./feature-nav";
import {
  CAROUSEL_CONFIG,
  DESKTOP_DEPTH,
  DRAG_SENSITIVITY,
  MOBILE_DEPTH,
  VELOCITY_FACTOR,
} from "./features-config";

const MOBILE_EDGE_MASK = {
  maskImage:
    "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
  WebkitMaskImage:
    "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
} as const;

const MOBILE_SWIPE_THRESHOLD_PX = 42;
const MOBILE_VELOCITY_MAX_PX = 280;
const MOBILE_VELOCITY_WEIGHT = 0.09;
const DESKTOP_VELOCITY_MAX_PX = 1600;
const CLICK_SUPPRESS_THRESHOLD_PX = 10;
const CLICK_SUPPRESS_MS = 140;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getMobileSwipeDirection(offsetX: number, velocityX: number) {
  const effective =
    offsetX + clamp(velocityX, -MOBILE_VELOCITY_MAX_PX, MOBILE_VELOCITY_MAX_PX) * MOBILE_VELOCITY_WEIGHT;
  if (Math.abs(effective) < MOBILE_SWIPE_THRESHOLD_PX) return 0;
  return effective < 0 ? 1 : -1;
}

export function Features3DCarousel() {
  const bp = useBreakpoint();
  const isMd = bp === "md" || bp === "lg" || bp === "xl";

  const cfg = CAROUSEL_CONFIG[bp];
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  const { rotation, activeIndex, goTo, next, prev, pauseAutoPlay, resumeAutoPlay } =
    useEllipseCarousel({
      count: features.length,
      autoPlayMs: 5000,
      containerRef,
    });

  const dragStartRotation = useRef(0);
  const didDragRef = useRef(false);
  const suppressClickRef = useRef(false);

  const markInteracted = useCallback(() => setHasInteracted(true), []);

  const activeFeature = features[activeIndex]!;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          prev();
          markInteracted();
          break;
        case "ArrowRight":
          e.preventDefault();
          next();
          markInteracted();
          break;
      }
    };
    el.addEventListener("keydown", handleKeyDown);
    return () => el.removeEventListener("keydown", handleKeyDown);
  }, [prev, next, markInteracted]);

  return (
    <FadeIn>
      <div
        ref={containerRef}
        className="relative px-2 sm:px-4 md:px-14 outline-none"
        onMouseEnter={isMd ? pauseAutoPlay : undefined}
        onMouseLeave={isMd ? resumeAutoPlay : undefined}
        onFocus={isMd ? pauseAutoPlay : undefined}
        onBlur={isMd ? resumeAutoPlay : undefined}
        role="region"
        aria-roledescription="carousel"
        aria-label="Funktionen"
        tabIndex={0}
      >
        <button
          type="button"
          onClick={() => {
            prev();
            markInteracted();
          }}
          className="premium-panel absolute left-0 top-1/2 z-110 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-foreground transition-all duration-300 hover:scale-110 hover:bg-primary hover:text-primary-foreground hover:shadow-lg focus-visible:outline-2 md:flex"
          aria-label="Zurück"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div
          className="-mx-4 overflow-hidden sm:-mx-6 md:mx-0 md:overflow-visible"
          style={!isMd ? MOBILE_EDGE_MASK : undefined}
        >
          <div className="px-4 sm:px-6 md:px-0">
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0}
              dragMomentum={false}
              onDragStart={() => {
                pauseAutoPlay();
                markInteracted();
                dragStartRotation.current = rotation.get();
                didDragRef.current = false;
              }}
              onDrag={(_, info) => {
                if (Math.abs(info.offset.x) > CLICK_SUPPRESS_THRESHOLD_PX) {
                  didDragRef.current = true;
                }
                rotation.set(
                  dragStartRotation.current + info.offset.x * DRAG_SENSITIVITY
                );
              }}
              onDragEnd={(_, info) => {
                if (didDragRef.current) {
                  suppressClickRef.current = true;
                  window.setTimeout(() => {
                    suppressClickRef.current = false;
                  }, CLICK_SUPPRESS_MS);
                }

                if (!isMd) {
                  const direction = getMobileSwipeDirection(info.offset.x, info.velocity.x);
                  if (direction === 0) {
                    goTo(activeIndex);
                  } else {
                    goTo((activeIndex + direction + features.length) % features.length);
                  }
                  resumeAutoPlay();
                  return;
                }

                const offsetDelta = info.offset.x * DRAG_SENSITIVITY;
                const velocityDelta =
                  clamp(info.velocity.x, -DESKTOP_VELOCITY_MAX_PX, DESKTOP_VELOCITY_MAX_PX) *
                  VELOCITY_FACTOR;
                const totalDelta = offsetDelta + velocityDelta;
                const angleStep = (Math.PI * 2) / features.length;
                const newRotation = dragStartRotation.current + totalDelta;
                const nearestIndex =
                  Math.round(-newRotation / angleStep) % features.length;
                goTo(
                  ((nearestIndex % features.length) + features.length) % features.length
                );
                resumeAutoPlay();
              }}
              style={{ cursor: "grab", touchAction: "pan-y" }}
              whileDrag={{ cursor: "grabbing" }}
            >
              <EllipseCarousel containerHeight={cfg.height}>
                {features.map((feature, i) => (
                  <EllipseCard
                    key={feature.title}
                    index={i}
                    totalCount={features.length}
                    rotation={rotation}
                    radiusX={cfg.radius.x}
                    radiusY={cfg.radius.y}
                    onClick={() => {
                      if (suppressClickRef.current) return;
                      goTo(i);
                      markInteracted();
                    }}
                    cardWidth={cfg.card.w}
                    cardHeight={cfg.card.h}
                    depth={isMd ? DESKTOP_DEPTH : MOBILE_DEPTH}
                  >
                    <FeatureCardContent feature={feature} isActive={activeIndex === i} />
                  </EllipseCard>
                ))}
              </EllipseCarousel>
            </motion.div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            next();
            markInteracted();
          }}
          className="premium-panel absolute right-0 top-1/2 z-110 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-foreground transition-all duration-300 hover:scale-110 hover:bg-primary hover:text-primary-foreground hover:shadow-lg focus-visible:outline-2 md:flex"
          aria-label="Weiter"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {!isMd && (
          <AnimatePresence>
            {!hasInteracted && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/60"
                aria-hidden="true"
              >
                <ChevronLeft className="h-3 w-3" />
                <span>Wischen zum Blättern</span>
                <ChevronRight className="h-3 w-3" />
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {!isMd && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                prev();
                markInteracted();
              }}
              className="premium-panel inline-flex h-9 min-w-24 items-center justify-center gap-1 rounded-full px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              aria-label="Vorherige Funktion"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Zurück</span>
            </button>
            <button
              type="button"
              onClick={() => {
                next();
                markInteracted();
              }}
              className="premium-panel inline-flex h-9 min-w-24 items-center justify-center gap-1 rounded-full px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              aria-label="Nächste Funktion"
            >
              <span>Weiter</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {activeFeature.title}
        </div>

        <FeatureNav items={features} activeIndex={activeIndex} onSelect={goTo} />
        <FeatureDetailPanel feature={activeFeature} />
      </div>
    </FadeIn>
  );
}

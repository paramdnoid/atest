"use client";

import { motion, useInView, useReducedMotion, type Variant } from "framer-motion";
import { memo, useRef } from "react";

import { useAnimatedNumber } from "@/hooks/use-animated-number";

import { EASE_SMOOTH } from "@/lib/constants";

type Direction = "up" | "down" | "left" | "right" | "none";

const directionVariants: Record<Direction, { hidden: Variant; visible: Variant }> = {
  up: { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } },
  down: { hidden: { opacity: 0, y: -30 }, visible: { opacity: 1, y: 0 } },
  left: { hidden: { opacity: 0, x: 40 }, visible: { opacity: 1, x: 0 } },
  right: { hidden: { opacity: 0, x: -40 }, visible: { opacity: 1, x: 0 } },
  none: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
};

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  direction?: Direction;
  delay?: number;
  duration?: number;
  once?: boolean;
  amount?: number;
}

export const FadeIn = memo(function FadeIn({
  children,
  className,
  direction = "up",
  delay = 0,
  duration = 0.6,
  once = true,
  amount = 0.15,
}: FadeInProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount });
  const prefersReducedMotion = useReducedMotion();

  // null = SSR / preference not yet resolved → render motion.div (matches client default)
  // true = user explicitly wants reduced motion → render plain div
  if (prefersReducedMotion === true) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={directionVariants[direction]}
      transition={{ duration, delay, ease: EASE_SMOOTH }}
      className={className}
      style={{ willChange: isInView ? "auto" : "opacity, transform" }}
    >
      {children}
    </motion.div>
  );
});

interface StaggerChildrenProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  delay?: number;
  once?: boolean;
  amount?: number;
}

export const StaggerChildren = memo(function StaggerChildren({
  children,
  className,
  staggerDelay = 0.08,
  delay = 0,
  once = true,
  amount = 0.1,
}: StaggerChildrenProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount });
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion === true) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: staggerDelay, delayChildren: delay },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
});

export const StaggerItem = memo(function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion === true) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.5, ease: EASE_SMOOTH }}
      className={className}
    >
      {children}
    </motion.div>
  );
});

interface AnimatedCounterProps {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

export const AnimatedCounter = memo(function AnimatedCounter({
  target,
  suffix = "",
  prefix = "",
  duration = 2,
  className,
}: AnimatedCounterProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const display = useAnimatedNumber(isInView ? target : 0, {
    duration: duration * 1000,
    bounce: 0,
  });

  return (
    <span ref={ref} className={className}>
      {prefix}
      {/* suppressHydrationWarning: toLocaleString("de-DE") can differ between
          Node.js (server) and the browser depending on ICU data. The value is
          only meaningful after hydration when the animation runs, so the
          mismatch is intentional and safe to suppress. */}
      <span suppressHydrationWarning>{display.toLocaleString("de-DE")}</span>
      {suffix}
    </span>
  );
});

"use client";

import { useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

type SpringConfigWithStiffness = {
  stiffness?: number;
  damping?: number;
  restDelta?: number;
};

type SpringConfigWithDuration = {
  duration?: number;
  bounce?: number;
};

type SpringConfig = SpringConfigWithStiffness | SpringConfigWithDuration;

export function useAnimatedNumber(
  value: number,
  options?: SpringConfig
): number {
  const prefersReduced = useReducedMotion();
  const spring = useSpring(value, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.01,
    ...options,
  });
  const rounded = useTransform(spring, Math.round);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    if (prefersReduced) return;
    const unsubscribe = rounded.on("change", setDisplay);
    return unsubscribe;
  }, [rounded, prefersReduced]);

  return prefersReduced ? value : display;
}

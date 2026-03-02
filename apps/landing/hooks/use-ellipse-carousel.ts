"use client";

import { animate, useMotionValue, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

const TWO_PI = Math.PI * 2;

const CAROUSEL_SPRING = {
  type: "spring" as const,
  stiffness: 180,
  damping: 28,
  mass: 1.2,
};

export type UseEllipseCarouselOptions = {
  count: number;
  autoPlayMs?: number;
  containerRef?: React.RefObject<HTMLElement | null>;
};

function animateToIndex(
  rotation: ReturnType<typeof useMotionValue<number>>,
  index: number,
  angleStep: number,
  prefersReduced: boolean | null
) {
  const target = -angleStep * index;
  const current = rotation.get();
  let diff = target - current;
  diff = ((((diff + Math.PI) % TWO_PI) + TWO_PI) % TWO_PI) - Math.PI;
  if (prefersReduced) {
    rotation.set(current + diff);
  } else {
    animate(rotation, current + diff, CAROUSEL_SPRING);
  }
}

export function useEllipseCarousel({
  count,
  autoPlayMs = 5000,
  containerRef,
}: UseEllipseCarouselOptions) {
  const angleStep = TWO_PI / count;
  const rotation = useMotionValue(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const prefersReduced = useReducedMotion();
  const pausedRef = useRef(false);
  const visibleRef = useRef(true);
  const activeIndexRef = useRef(0);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  const goTo = useCallback(
    (index: number) => {
      animateToIndex(rotation, index, angleStep, prefersReduced);
      setActiveIndex(index);
    },
    [angleStep, rotation, prefersReduced]
  );

  const next = useCallback(() => {
    goTo((activeIndex + 1) % count);
  }, [goTo, activeIndex, count]);

  const prev = useCallback(() => {
    goTo((activeIndex - 1 + count) % count);
  }, [goTo, activeIndex, count]);

  const pauseAutoPlay = useCallback(() => {
    pausedRef.current = true;
  }, []);

  const resumeAutoPlay = useCallback(() => {
    pausedRef.current = false;
  }, []);

  useEffect(() => {
    if (!containerRef?.current) return;
    const el = containerRef.current;

    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = !!entry?.isIntersecting;
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef]);

  useEffect(() => {
    if (autoPlayMs <= 0) return;

    let timerId: ReturnType<typeof setTimeout>;

    function tick() {
      timerId = setTimeout(() => {
        if (!pausedRef.current && visibleRef.current) {
          const nextIdx = (activeIndexRef.current + 1) % count;
          animateToIndex(rotation, nextIdx, angleStep, prefersReduced);
          setActiveIndex(nextIdx);
        }
        tick();
      }, autoPlayMs);
    }

    tick();
    return () => clearTimeout(timerId);
  }, [autoPlayMs, count, angleStep, rotation, prefersReduced]);

  return {
    rotation,
    activeIndex,
    angleStep,
    goTo,
    next,
    prev,
    pauseAutoPlay,
    resumeAutoPlay,
  };
}

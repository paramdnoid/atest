"use client";

import { useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { SceneErrorBoundary } from "@/components/scene-error-boundary";
import { cn } from "@/lib/utils";

const HeroScene = dynamic(() => import("@/components/hero-scene"), {
  ssr: false,
});

export function HeroSceneWrapper() {
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Defer opacity-100 to the next frame so the CSS transition actually fires.
    requestAnimationFrame(() => setVisible(true));
  }, []);

  // Must return null before mount on both server and client to avoid a
  // hydration mismatch. useReducedMotion() resolves synchronously to true/false
  // on the client but returns null during SSR, so branching on it before mount
  // produces different trees server vs client.
  if (!mounted || prefersReducedMotion) return null;

  return (
    <SceneErrorBoundary>
      <div className={cn("transition-opacity duration-1000 ease-out", visible ? "opacity-100" : "opacity-0")}>
        <HeroScene />
      </div>
    </SceneErrorBoundary>
  );
}

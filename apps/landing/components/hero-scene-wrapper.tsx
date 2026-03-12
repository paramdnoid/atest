"use client";

import { useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

import { SceneErrorBoundary } from "@/components/scene-error-boundary";
import { cn } from "@/lib/utils";

const HeroScene = dynamic(() => import("@/components/hero-scene"), {
  ssr: false,
});

export function HeroSceneWrapper() {
  const prefersReducedMotion = useReducedMotion();
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Must return null before mount on both server and client to avoid a
  // hydration mismatch. useReducedMotion() resolves synchronously to true/false
  // on the client but returns null during SSR, so branching on it before mount
  // produces different trees server vs client.
  if (!isClient || prefersReducedMotion) return null;

  return (
    <SceneErrorBoundary>
      <div className={cn("opacity-100")}>
        <HeroScene />
      </div>
    </SceneErrorBoundary>
  );
}

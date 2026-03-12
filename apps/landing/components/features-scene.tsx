"use client";

import "@/lib/suppress-three-clock-warning";

import { Canvas } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import { Suspense, useRef, useSyncExternalStore } from "react";

import { SceneErrorBoundary } from "@/components/scene-error-boundary";
import { cn } from "@/lib/utils";

import { WaveGrid } from "./wave-grid";

const FEATURES_CONFIG = {
  segments: 70,
  size: 28,
  speed: 0.3,
  amplitude: 0.4,
  secondaryAmplitude: 0.3,
  rotation: -0.55,
  position: [0, -1.5, 0] as [number, number, number],
  secondaryPosition: [0, -2.5, -1.2] as [number, number, number],
  secondaryRotation: -0.52,
  opacity: 0.18,
  secondaryOpacity: 0.1,
};

function FeaturesScene() {
  const mouse = useRef({ x: 0, y: 0 });

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 -z-10 hidden md:block")}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 3, 8], fov: 50, near: 0.1, far: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ pointerEvents: "auto" }}
        onPointerMove={(e) => {
          const rect = (e.target as HTMLElement).getBoundingClientRect();
          mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        }}
      >
        <Suspense fallback={null}>
          <WaveGrid config={FEATURES_CONFIG} mouseRef={mouse} />
        </Suspense>
      </Canvas>
    </div>
  );
}

export function FeaturesSceneWrapper() {
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const prefersReducedMotion = useReducedMotion();

  // Render nothing until after hydration so server and client initial output match.
  // Also skip for users who prefer reduced motion.
  if (!isClient || prefersReducedMotion) return null;

  return (
    <SceneErrorBoundary>
      <FeaturesScene />
    </SceneErrorBoundary>
  );
}

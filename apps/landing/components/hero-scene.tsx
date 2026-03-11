"use client";

import "@/lib/suppress-three-clock-warning";

import { Canvas } from "@react-three/fiber";
import { Suspense, useRef } from "react";

import { WaveGrid } from "./wave-grid";

const HERO_CONFIG = {
  segments: 60,
  size: 22,
  speed: 0.4,
  amplitude: 0.4,
  secondaryAmplitude: 0.3,
  rotation: -0.55,
  position: [0, 2.5, 0] as [number, number, number],
  secondaryPosition: [0, 3, 1.5] as [number, number, number],
  secondaryRotation: -0.53,
  opacity: 0.1,
  secondaryOpacity: 0.05,
};

export default function HeroScene() {
  const mouse = useRef({ x: 0, y: 0 });

  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 block"
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 3, 8], fov: 50, near: 0.1, far: 50 }}
        dpr={[0.8, 1.3]}
        gl={{ antialias: true, alpha: true }}
        className="pointer-events-none md:pointer-events-auto"
        onPointerMove={(e) => {
          const rect = (e.target as HTMLElement).getBoundingClientRect();
          mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        }}
      >
        <Suspense fallback={null}>
          <WaveGrid config={HERO_CONFIG} mouseRef={mouse} />
        </Suspense>
      </Canvas>
    </div>
  );
}

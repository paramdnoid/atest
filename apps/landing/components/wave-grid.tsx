"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Mesh } from "three";
import * as THREE from "three";

const BRAND_PRIMARY = "#f97316";

export interface WaveGridConfig {
  segments: number;
  size: number;
  speed: number;
  amplitude: number;
  secondaryAmplitude: number;
  rotation: number;
  position: [number, number, number];
  secondaryPosition: [number, number, number];
  secondaryRotation: number;
  opacity: number;
  secondaryOpacity: number;
}

interface WaveGridProps {
  config: WaveGridConfig;
  mouseRef?: React.RefObject<{ x: number; y: number }>;
}

export function WaveGrid({ config, mouseRef }: WaveGridProps) {
  const meshRef = useRef<Mesh>(null);
  const meshRef2 = useRef<Mesh>(null);

  const { segments, size, speed, amplitude, secondaryAmplitude } = config;

  const originalPositions = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    const attr = geo.getAttribute("position") as THREE.BufferAttribute;
    const copy = new Float32Array(attr.array.length);
    copy.set(attr.array);
    geo.dispose();
    return copy;
  }, [size, segments]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    const time = clock.elapsedTime;
    const positions = meshRef.current.geometry.getAttribute(
      "position"
    ) as THREE.BufferAttribute;

    for (let i = 0; i < positions.count; i++) {
      const ox = originalPositions[i * 3]!;
      const oy = originalPositions[i * 3 + 1]!;

      const z =
        Math.sin(ox * 0.35 + time * speed) * amplitude +
        Math.cos(oy * 0.3 + time * (speed * 0.75)) * (amplitude * 0.75) +
        Math.sin((ox + oy) * 0.2 + time * (speed * 0.625)) * (amplitude * 0.5);

      positions.setZ(i, z);
    }
    positions.needsUpdate = true;

    if (meshRef2.current) {
      const positions2 = meshRef2.current.geometry.getAttribute(
        "position"
      ) as THREE.BufferAttribute;

      for (let i = 0; i < positions2.count; i++) {
        const ox = originalPositions[i * 3]!;
        const oy = originalPositions[i * 3 + 1]!;

        const z =
          Math.sin(ox * 0.35 + time * speed + 1.5) * secondaryAmplitude +
          Math.cos(oy * 0.3 + time * (speed * 0.75) + 1.0) * (secondaryAmplitude * 0.8) +
          Math.sin((ox + oy) * 0.2 + time * (speed * 0.625) + 2.0) *
            (secondaryAmplitude * 0.5);

        positions2.setZ(i, z);
      }
      positions2.needsUpdate = true;
    }

    if (mouseRef?.current) {
      const targetRotX = config.rotation + mouseRef.current.y * 0.06;
      const targetRotY = mouseRef.current.x * 0.08;

      meshRef.current.rotation.x += (targetRotX - meshRef.current.rotation.x) * 0.02;
      meshRef.current.rotation.y += (targetRotY - meshRef.current.rotation.y) * 0.02;

      if (meshRef2.current) {
        meshRef2.current.rotation.x +=
          (targetRotX - 0.02 - meshRef2.current.rotation.x) * 0.015;
        meshRef2.current.rotation.y += (targetRotY - meshRef2.current.rotation.y) * 0.015;
      }
    }
  });

  return (
    <>
      <mesh ref={meshRef} rotation={[config.rotation, 0, 0]} position={config.position}>
        <planeGeometry args={[size, size, segments, segments]} />
        <meshBasicMaterial
          color={BRAND_PRIMARY}
          wireframe
          transparent
          opacity={config.opacity}
          depthWrite={false}
        />
      </mesh>
      <mesh
        ref={meshRef2}
        rotation={[config.secondaryRotation, 0, 0]}
        position={config.secondaryPosition}
      >
        <planeGeometry args={[size, size, segments, segments]} />
        <meshBasicMaterial
          color={BRAND_PRIMARY}
          wireframe
          transparent
          opacity={config.secondaryOpacity}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

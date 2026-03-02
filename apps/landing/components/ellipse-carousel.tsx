"use client";

import { motion, type MotionValue, useTransform } from "framer-motion";
import { memo, type ReactNode, useMemo } from "react";

const TWO_PI = Math.PI * 2;

type EllipseCarouselProps = {
  children: ReactNode;
  containerHeight: number;
};

export function EllipseCarousel({ children, containerHeight }: EllipseCarouselProps) {
  return (
    <div className="relative w-full" style={{ height: containerHeight }}>
      {children}
    </div>
  );
}

export type DepthConfig = {
  scaleRange: [number, number];
  blurMax: number;
  brightnessRange: [number, number];
  opacityRange: [number, number];
  shadowSpreadMax: number;
  shadowAlphaMax: number;
};

const DEFAULT_DEPTH: DepthConfig = {
  scaleRange: [0.6, 1.0],
  blurMax: 2.5,
  brightnessRange: [0.6, 1.0],
  opacityRange: [0.55, 1.0],
  shadowSpreadMax: 30,
  shadowAlphaMax: 0.25,
};

type EllipseCardProps = {
  index: number;
  totalCount: number;
  rotation: MotionValue<number>;
  radiusX: number;
  radiusY: number;
  onClick: () => void;
  children: ReactNode;
  cardWidth: number;
  cardHeight: number;
  depth?: DepthConfig;
};

type CardStyles = {
  x: number;
  y: number;
  scale: number;
  zIndex: number;
  filter: string;
  opacity: number;
  boxShadow: string;
};

function computeCardStyles(
  r: number,
  angleStep: number,
  index: number,
  radiusX: number,
  radiusY: number,
  d: DepthConfig
): CardStyles {
  const angle = angleStep * index + r;
  const cosAngle = Math.cos(angle);
  const t = (1 + cosAngle) / 2;

  const brightness =
    d.brightnessRange[0] + t * (d.brightnessRange[1] - d.brightnessRange[0]);
  const blur = (1 - t) * d.blurMax;
  const spread = Math.round(t * d.shadowSpreadMax);
  const alpha = (t * d.shadowAlphaMax).toFixed(2);

  return {
    x: Math.sin(angle) * radiusX,
    y: -cosAngle * radiusY,
    scale: d.scaleRange[0] + t * (d.scaleRange[1] - d.scaleRange[0]),
    zIndex: Math.round(t * 100),
    filter: `brightness(${brightness}) blur(${blur}px)`,
    opacity: d.opacityRange[0] + t * (d.opacityRange[1] - d.opacityRange[0]),
    boxShadow: `0 ${spread}px ${spread * 2}px rgba(0, 0, 0, ${alpha})`,
  };
}

export const EllipseCard = memo(function EllipseCard({
  index,
  totalCount,
  rotation,
  radiusX,
  radiusY,
  onClick,
  children,
  cardWidth,
  cardHeight,
  depth: d = DEFAULT_DEPTH,
}: EllipseCardProps) {
  const angleStep = TWO_PI / totalCount;

  const styles = useTransform(rotation, (r) =>
    computeCardStyles(r, angleStep, index, radiusX, radiusY, d)
  );

  const x = useTransform(styles, (s) => s.x);
  const y = useTransform(styles, (s) => s.y);
  const scale = useTransform(styles, (s) => s.scale);
  const zIndex = useTransform(styles, (s) => s.zIndex);
  const filter = useTransform(styles, (s) => s.filter);
  const opacity = useTransform(styles, (s) => s.opacity);
  const boxShadow = useTransform(styles, (s) => s.boxShadow);

  const staticStyles = useMemo(
    () => ({
      position: "absolute" as const,
      left: "50%",
      top: "50%",
      width: cardWidth,
      marginLeft: -(cardWidth / 2),
      marginTop: -(cardHeight / 2),
      willChange: "transform, filter, opacity" as const,
    }),
    [cardWidth, cardHeight]
  );

  return (
    <motion.div
      suppressHydrationWarning
      style={{
        x,
        y,
        scale,
        zIndex,
        filter,
        opacity,
        boxShadow,
        ...staticStyles,
      }}
      onClick={onClick}
      className="cursor-pointer rounded-2xl"
      role="group"
      aria-roledescription="slide"
    >
      {children}
    </motion.div>
  );
});

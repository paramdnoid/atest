import type { DepthConfig } from "@/components/ellipse-carousel";

export const CAROUSEL_CONFIG = {
  xs: { radius: { x: 150, y: 18 }, card: { w: 248, h: 158 }, height: 248 },
  sm: { radius: { x: 198, y: 24 }, card: { w: 266, h: 168 }, height: 270 },
  md: { radius: { x: 320, y: 42 }, card: { w: 282, h: 176 }, height: 300 },
  lg: { radius: { x: 390, y: 48 }, card: { w: 302, h: 184 }, height: 320 },
  xl: { radius: { x: 440, y: 54 }, card: { w: 320, h: 190 }, height: 336 },
} as const;

export const DRAG_SENSITIVITY = 0.004;
export const VELOCITY_FACTOR = 0.001;

export const DESKTOP_DEPTH: DepthConfig = {
  scaleRange: [0.55, 1.05],
  blurMax: 3,
  brightnessRange: [0.5, 1.0],
  opacityRange: [0.4, 1.0],
  shadowSpreadMax: 35,
  shadowAlphaMax: 0.3,
};

export const MOBILE_DEPTH: DepthConfig = {
  scaleRange: [0.45, 1.0],
  blurMax: 5,
  brightnessRange: [0.4, 1.0],
  opacityRange: [0.2, 1.0],
  shadowSpreadMax: 24,
  shadowAlphaMax: 0.3,
};

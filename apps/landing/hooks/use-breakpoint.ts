"use client";

import { useSyncExternalStore } from "react";

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl";

const QUERIES = Object.entries(BREAKPOINTS)
  .sort(([, a], [, b]) => b - a)
  .map(([key, px]) => ({
    key: key as Exclude<Breakpoint, "xs">,
    query: `(min-width: ${px}px)`,
  }));

function getBreakpoint(): Breakpoint {
  for (const { key, query } of QUERIES) {
    if (window.matchMedia(query).matches) return key;
  }
  return "xs";
}

function subscribe(callback: () => void): () => void {
  const mqls = QUERIES.map(({ query }) => window.matchMedia(query));
  for (const mql of mqls) mql.addEventListener("change", callback);
  return () => {
    for (const mql of mqls) mql.removeEventListener("change", callback);
  };
}

const SERVER_SNAPSHOT: Breakpoint = "xs";

export function useBreakpoint(): Breakpoint {
  return useSyncExternalStore(subscribe, getBreakpoint, () => SERVER_SNAPSHOT);
}

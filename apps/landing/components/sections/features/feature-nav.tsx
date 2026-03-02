"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { type KeyboardEvent, memo, useCallback, useRef } from "react";

import type { Feature } from "@/content/features";

export const FeatureNav = memo(function FeatureNav({
  items,
  activeIndex,
  onSelect,
}: {
  items: readonly Feature[];
  activeIndex: number;
  onSelect: (i: number) => void;
}) {
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      let next = activeIndex;
      if (e.key === "ArrowRight") next = (activeIndex + 1) % items.length;
      else if (e.key === "ArrowLeft")
        next = (activeIndex - 1 + items.length) % items.length;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = items.length - 1;
      else return;

      e.preventDefault();
      onSelect(next);
      tabsRef.current[next]?.focus();
    },
    [activeIndex, items.length, onSelect]
  );

  return (
    <div
      className="mt-1 flex justify-center sm:mt-2"
      role="tablist"
      aria-label="Funktionen"
      onKeyDown={handleKeyDown}
    >
      <div className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full border bg-background/80 p-1.5 shadow-sm backdrop-blur-sm [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {items.map((feature, i) => {
          const isActive = activeIndex === i;
          const Icon = feature.icon;
          return (
            <button
              key={feature.title}
              ref={(el) => {
                tabsRef.current[i] = el;
              }}
              type="button"
              role="tab"
              tabIndex={isActive ? 0 : -1}
              aria-selected={isActive}
              aria-label={`${feature.title} (${i + 1} / ${items.length})`}
              className={cn(
                "relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 sm:h-10 sm:w-10",
                isActive
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              onClick={() => onSelect(i)}
            >
              {isActive && (
                <motion.div
                  layoutId="features-nav-indicator"
                  className="absolute inset-0 rounded-full bg-primary shadow-md shadow-primary/25"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                className="relative z-10 h-4 w-4 sm:h-4.5 sm:w-4.5"
                strokeWidth={isActive ? 2 : 1.5}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
});

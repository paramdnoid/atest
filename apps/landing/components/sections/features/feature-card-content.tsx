"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { memo } from "react";

import type { Feature } from "@/content/features";
import { EASE_SMOOTH } from "@/lib/constants";

export const FeatureCardContent = memo(function FeatureCardContent({
  feature,
  isActive,
}: {
  feature: Feature;
  isActive?: boolean;
}) {
  const Icon = feature.icon;
  return (
    <motion.div
      key={isActive ? "active" : "inactive"}
      initial={isActive ? { scale: 0.97, opacity: 0.8 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.35, ease: EASE_SMOOTH }}
      className={cn(
        "feature-card group relative h-full overflow-hidden rounded-2xl transition-all duration-300",
        isActive && "feature-card-active"
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-gradient-to-r from-primary/0 via-primary/40 to-primary/0 transition-opacity duration-300",
          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60"
        )}
      />

      <Icon
        className="pointer-events-none absolute right-4 top-4 h-16 w-16 text-primary/[0.03] transition-all duration-500 group-hover:text-primary/[0.06] sm:h-[4.5rem] sm:w-[4.5rem]"
        strokeWidth={0.75}
      />

      <div className="relative flex h-full flex-col justify-center p-4 sm:p-5">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all duration-300 sm:h-11 sm:w-11",
            isActive
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
              : "bg-primary/8 text-primary ring-1 ring-primary/10 group-hover:bg-primary/12 group-hover:ring-primary/20 group-hover:shadow-sm"
          )}
        >
          <Icon className="h-4.5 w-4.5 sm:h-5 sm:w-5" strokeWidth={1.75} />
        </div>
        <p className="font-display mt-3 text-[15px] font-bold tracking-tight text-foreground sm:text-base">
          {feature.title}
        </p>
        <p className="mt-1 text-xs leading-snug text-muted-foreground sm:text-[13px]">
          {feature.description}
        </p>
      </div>
    </motion.div>
  );
});

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { memo } from "react";

import type { Feature } from "@/content/features";
import { EASE_SMOOTH } from "@/lib/constants";

const pillContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
} as const;

const pillItemVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
} as const;

export const FeatureDetailPanel = memo(function FeatureDetailPanel({
  feature,
}: {
  feature: Feature;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={feature.title}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: EASE_SMOOTH }}
        className="mx-auto mt-4 max-w-xs text-center sm:mt-5 sm:max-w-lg md:mt-6 md:max-w-2xl"
      >
        <motion.ul
          variants={pillContainerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-wrap justify-center gap-2 sm:gap-2.5"
        >
          {feature.benefits.map((benefit) => (
            <motion.li
              key={benefit}
              variants={pillItemVariants}
              transition={{ duration: 0.3, ease: EASE_SMOOTH }}
              className="text-muted-foreground flex items-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-2.5 py-1 text-[11px] shadow-sm backdrop-blur-sm sm:gap-2 sm:px-3 sm:py-1.5 sm:text-xs"
            >
              <Check
                className="h-3 w-3 shrink-0 text-primary sm:h-3.5 sm:w-3.5"
                strokeWidth={2.5}
              />
              {benefit}
            </motion.li>
          ))}
        </motion.ul>
      </motion.div>
    </AnimatePresence>
  );
});

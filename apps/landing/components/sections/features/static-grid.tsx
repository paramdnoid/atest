"use client";

import { StaggerChildren, StaggerItem } from "@/components/fade-in";
import { features } from "@/content/features";

import { FeatureCardContent } from "./feature-card-content";

export function StaticGrid() {
  return (
    <StaggerChildren
      className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:gap-6"
      staggerDelay={0.06}
    >
      {features.map((feature) => (
        <StaggerItem key={feature.title} className="min-h-[14rem]">
          <FeatureCardContent feature={feature} />
        </StaggerItem>
      ))}
    </StaggerChildren>
  );
}

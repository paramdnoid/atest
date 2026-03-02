import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

const widthClasses = {
  narrow: "max-w-3xl",
  default: "max-w-7xl",
  wide: "max-w-[90rem]",
  full: "",
} as const;

type SectionContainerProps = {
  children: ReactNode;
  className?: string;
  width?: keyof typeof widthClasses;
  as?: "div" | "main" | "section" | "nav" | "footer" | "header";
};

export function SectionContainer({
  children,
  className,
  width = "default",
  as: Tag = "div",
}: SectionContainerProps) {
  return (
    <Tag
      className={cn(
        "mx-auto px-4 sm:px-6 lg:px-8",
        widthClasses[width],
        className,
      )}
    >
      {children}
    </Tag>
  );
}

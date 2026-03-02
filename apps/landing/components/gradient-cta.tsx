import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function GradientCta({
  href,
  children,
  disabled = false,
  className,
}: {
  href: string;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  if (disabled) {
    return (
      <Button
        size="lg"
        disabled
        className={cn(
          "group h-13 w-full cursor-not-allowed gap-2 bg-linear-to-r from-[oklch(0.58_0.19_47)] to-[oklch(0.55_0.19_55)] px-8 text-base font-semibold text-white opacity-70 shadow-lg shadow-primary/20 sm:w-auto",
          className,
        )}
      >
        {children}
        <ArrowRight className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      className={cn(
        "group h-13 w-full gap-2 bg-linear-to-r from-[oklch(0.58_0.19_47)] to-[oklch(0.55_0.19_55)] px-8 text-base font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 sm:w-auto",
        className,
      )}
      asChild
    >
      <Link href={href}>
        {children}
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
      </Link>
    </Button>
  );
}

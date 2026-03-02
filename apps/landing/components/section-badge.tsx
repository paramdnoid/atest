import { Badge } from "@/components/ui/badge";
import type { LucideIcon } from "lucide-react";

export function SectionBadge({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <Badge
      variant="secondary"
      className="enterprise-kicker text-foreground mb-4 inline-flex border px-5 py-2 text-xs font-semibold tracking-[0.14em] uppercase backdrop-blur-sm"
    >
      <Icon className="text-primary h-3.5 w-3.5" />
      {children}
    </Badge>
  );
}

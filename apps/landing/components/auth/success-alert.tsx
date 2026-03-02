import { CheckCircle2 } from "lucide-react";
import type { ReactNode } from "react";

export function SuccessAlert({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
      <p className="inline-flex items-center gap-2 font-semibold">
        <CheckCircle2 className="h-4 w-4 text-primary" />
        {title}
      </p>
      <p className="text-muted-foreground mt-2">{children}</p>
    </div>
  );
}

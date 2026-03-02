import { Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { Button } from "@/components/ui/button";

type ButtonProps = ComponentProps<typeof Button>;

type LoadingButtonProps = ButtonProps & {
  pending: boolean;
  icon?: LucideIcon;
  pendingText?: string;
  iconOnly?: boolean;
  iconSize?: string;
};

export function LoadingButton({
  pending,
  icon: Icon,
  pendingText,
  iconOnly = false,
  iconSize = "h-4 w-4",
  disabled,
  children,
  ...props
}: LoadingButtonProps) {
  const spinnerSize = iconOnly ? "h-3.5 w-3.5" : iconSize;

  return (
    <Button disabled={pending || disabled} {...props}>
      {pending ? (
        <>
          <Loader2 className={`${spinnerSize} animate-spin`} />
          {!iconOnly && (pendingText ?? children)}
        </>
      ) : (
        <>
          {Icon && <Icon className={iconSize} />}
          {!iconOnly && children}
        </>
      )}
    </Button>
  );
}

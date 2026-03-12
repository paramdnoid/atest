import { Check } from 'lucide-react';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

type FormSelectProps = ComponentProps<'select'>;
type FormTextareaProps = ComponentProps<'textarea'>;

export function FormSelect({ className, children, ...props }: FormSelectProps) {
  return (
    <select
      className={cn(
        'h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors',
        'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function FormTextarea({ className, ...props }: FormTextareaProps) {
  return (
    <textarea
      className={cn(
        'min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors',
        'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30',
        className,
      )}
      {...props}
    />
  );
}

type FormCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
  className?: string;
};

export function FormCheckbox({ checked, onChange, ariaLabel, className }: FormCheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex h-4 w-4 items-center justify-center rounded-sm border border-input bg-background transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30',
        checked ? 'border-primary bg-primary text-primary-foreground' : 'text-transparent',
        className,
      )}
    >
      <Check className="h-3 w-3" />
    </button>
  );
}

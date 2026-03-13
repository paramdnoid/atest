import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type SemanticBadgeTone =
  | 'neutral'
  | 'info'
  | 'warning'
  | 'danger'
  | 'success'
  | 'accent';

const semanticBadgeClassMap: Record<SemanticBadgeTone, string> = {
  neutral: 'border-border text-foreground bg-transparent',
  info: 'border-sky-700/45 text-sky-700 bg-transparent dark:text-sky-300',
  warning: 'border-amber-700/45 text-amber-700 bg-transparent dark:text-amber-300',
  danger: 'border-destructive/55 text-destructive bg-transparent',
  success: 'border-emerald-700/45 text-emerald-700 bg-transparent dark:text-emerald-300',
  accent: 'border-primary/55 text-primary bg-transparent',
};

const semanticBadgeDotClassMap: Record<SemanticBadgeTone, string> = {
  neutral: 'bg-foreground/55',
  info: 'bg-sky-700 dark:bg-sky-300',
  warning: 'bg-amber-700 dark:bg-amber-300',
  danger: 'bg-destructive',
  success: 'bg-emerald-700 dark:bg-emerald-300',
  accent: 'bg-primary',
};

export function getSemanticBadgeClass(tone: SemanticBadgeTone): string {
  return semanticBadgeClassMap[tone];
}

export function SemanticBadge({
  label,
  tone,
  className,
}: {
  label: string;
  tone: SemanticBadgeTone;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn('gap-1.5', getSemanticBadgeClass(tone), className)}>
      <span
        aria-hidden="true"
        className={cn('h-1.5 w-1.5 rounded-full', semanticBadgeDotClassMap[tone])}
      />
      <span>{label}</span>
    </Badge>
  );
}

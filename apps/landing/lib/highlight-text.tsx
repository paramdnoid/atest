import type { ReactNode } from "react";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Highlights all occurrences of `query` within `text` using <mark> tags.
 * Returns plain text when query is empty.
 */
export function highlightText(text: string, query: string): ReactNode {
  const normalized = query.trim();
  if (normalized.length === 0) return text;

  const regex = new RegExp(`(${escapeRegExp(normalized)})`, "gi");
  const parts = text.split(regex);
  const lower = normalized.toLowerCase();
  return parts.map((part, index) =>
    part.toLowerCase() === lower ? (
      <mark
        key={`${part}-${index}`}
        className="bg-primary/15 text-foreground rounded-sm px-0.5 py-0"
      >
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  );
}

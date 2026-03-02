"use client";

export const GENERIC_ERROR_MESSAGE =
  "Ein Fehler ist aufgetreten. Bitte versuche es erneut.";

export function FormError({ message }: { message: string | null | undefined }) {
  if (!message) return null;

  return (
    <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
      {message}
    </p>
  );
}

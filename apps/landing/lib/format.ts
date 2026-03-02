export function formatCurrency(cents: number, interval?: string): string {
  const euros = (cents / 100).toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const suffix = interval === "month" ? "/Monat" : interval === "year" ? "/Jahr" : "";
  return `${euros} €${suffix}`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const statusLabels: Record<string, string> = {
  trialing: "Testphase",
  active: "Aktiv",
  past_due: "Überfällig",
  canceled: "Gekündigt",
  incomplete: "Unvollständig",
  incomplete_expired: "Abgelaufen",
  unpaid: "Unbezahlt",
  ACTIVE: "Aktiv",
  INACTIVE: "Inaktiv",
  CANCELED: "Gekündigt",
};

export function formatSubscriptionStatus(status: string): string {
  return statusLabels[status] ?? status;
}

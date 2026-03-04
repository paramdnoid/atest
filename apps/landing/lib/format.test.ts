import { describe, it, expect } from "vitest";
import { formatCurrency, formatDate, formatSubscriptionStatus } from "./format";

describe("formatCurrency", () => {
  it("formats cents to euros with German locale", () => {
    const result = formatCurrency(1999);
    expect(result).toBe("19,99 \u20ac");
  });

  it("formats zero cents", () => {
    const result = formatCurrency(0);
    expect(result).toBe("0,00 \u20ac");
  });

  it("formats large amounts with thousands separator", () => {
    const result = formatCurrency(123456);
    expect(result).toBe("1.234,56 \u20ac");
  });

  it("appends /Monat suffix for monthly interval", () => {
    const result = formatCurrency(2900, "month");
    expect(result).toBe("29,00 \u20ac/Monat");
  });

  it("appends /Jahr suffix for yearly interval", () => {
    const result = formatCurrency(29900, "year");
    expect(result).toBe("299,00 \u20ac/Jahr");
  });

  it("appends no suffix for unknown interval", () => {
    const result = formatCurrency(500, "weekly");
    expect(result).toBe("5,00 \u20ac");
  });

  it("appends no suffix when interval is undefined", () => {
    const result = formatCurrency(500);
    expect(result).toBe("5,00 \u20ac");
  });

  it("handles single cent", () => {
    const result = formatCurrency(1);
    expect(result).toBe("0,01 \u20ac");
  });
});

describe("formatDate", () => {
  it("formats a Date object to German locale dd.MM.yyyy", () => {
    const result = formatDate(new Date("2024-01-15T00:00:00Z"));
    expect(result).toBe("15.01.2024");
  });

  it("formats a date string to German locale", () => {
    const result = formatDate("2023-12-25");
    expect(result).toBe("25.12.2023");
  });

  it("formats an ISO date string", () => {
    const result = formatDate("2024-06-01T14:30:00.000Z");
    expect(result).toBe("01.06.2024");
  });
});

describe("formatSubscriptionStatus", () => {
  it("maps trialing to Testphase", () => {
    expect(formatSubscriptionStatus("trialing")).toBe("Testphase");
  });

  it("maps active to Aktiv", () => {
    expect(formatSubscriptionStatus("active")).toBe("Aktiv");
  });

  it("maps past_due to \u00dcberf\u00e4llig", () => {
    expect(formatSubscriptionStatus("past_due")).toBe("\u00dcberf\u00e4llig");
  });

  it("maps canceled to Gek\u00fcndigt", () => {
    expect(formatSubscriptionStatus("canceled")).toBe("Gek\u00fcndigt");
  });

  it("maps incomplete to Unvollst\u00e4ndig", () => {
    expect(formatSubscriptionStatus("incomplete")).toBe("Unvollst\u00e4ndig");
  });

  it("maps incomplete_expired to Abgelaufen", () => {
    expect(formatSubscriptionStatus("incomplete_expired")).toBe("Abgelaufen");
  });

  it("maps unpaid to Unbezahlt", () => {
    expect(formatSubscriptionStatus("unpaid")).toBe("Unbezahlt");
  });

  it("maps ACTIVE to Aktiv", () => {
    expect(formatSubscriptionStatus("ACTIVE")).toBe("Aktiv");
  });

  it("maps INACTIVE to Inaktiv", () => {
    expect(formatSubscriptionStatus("INACTIVE")).toBe("Inaktiv");
  });

  it("maps CANCELED to Gek\u00fcndigt", () => {
    expect(formatSubscriptionStatus("CANCELED")).toBe("Gek\u00fcndigt");
  });

  it("returns the raw status for unknown values", () => {
    expect(formatSubscriptionStatus("unknown_status")).toBe("unknown_status");
  });

  it("returns empty string for empty input", () => {
    expect(formatSubscriptionStatus("")).toBe("");
  });
});

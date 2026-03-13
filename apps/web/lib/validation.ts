export type JsonRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null;
}

export function expectRecord(value: unknown, context: string): JsonRecord {
  if (!isRecord(value)) {
    throw new Error(`Ungueltige Antwort fuer ${context}.`);
  }
  return value;
}

export function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export function optionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

export function optionalArray<T>(
  value: unknown,
  mapItem: (entry: unknown, index: number) => T | null,
): T[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry, index) => mapItem(entry, index))
    .filter((entry): entry is T => entry !== null);
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value == null) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') return true;
  if (normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off') return false;
  return fallback;
}

export const angeboteRolloutFlags = {
  enableIntelligence: parseBoolean(process.env.NEXT_PUBLIC_ANGEBOTE_INTELLIGENCE, true),
  enableOptionBuilder: parseBoolean(process.env.NEXT_PUBLIC_ANGEBOTE_OPTION_BUILDER, true),
  enableQuickConvert: parseBoolean(process.env.NEXT_PUBLIC_ANGEBOTE_QUICK_CONVERT, true),
};

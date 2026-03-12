function getBooleanFlag(name: string, fallback = false): boolean {
  const value = process.env[name];
  if (value === undefined) return fallback;
  return value === '1' || value.toLowerCase() === 'true';
}

export const abnahmenRolloutFlags = {
  enableProtocolSignoff: getBooleanFlag('NEXT_PUBLIC_ABNAHMEN_ENABLE_PROTOCOL_SIGNOFF', true),
  enablePrivacyGuards: getBooleanFlag('NEXT_PUBLIC_ABNAHMEN_ENABLE_PRIVACY_GUARDS', true),
  enableInsights: getBooleanFlag('NEXT_PUBLIC_ABNAHMEN_ENABLE_INSIGHTS', true),
} as const;

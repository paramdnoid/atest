function parseFlag(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

export const aufmassRolloutFlags = {
  enableAssistedMigration: parseFlag(process.env.NEXT_PUBLIC_AUFMASS_ENABLE_ASSISTED_MIGRATION, true),
  enforceBuilderScoreGate: parseFlag(process.env.NEXT_PUBLIC_AUFMASS_ENFORCE_SCORE_GATE, true),
};

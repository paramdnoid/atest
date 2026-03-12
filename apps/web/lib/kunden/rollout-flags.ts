function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value == null) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on') return true;
  if (normalized === '0' || normalized === 'false' || normalized === 'no' || normalized === 'off') return false;
  return fallback;
}

export const kundenRolloutFlags = {
  kundenModuleEnabled: parseBoolean(process.env.NEXT_PUBLIC_KUNDEN_MODULE_ENABLED, true),
  kundenEliteFeaturesEnabled: parseBoolean(process.env.NEXT_PUBLIC_KUNDEN_ELITE_FEATURES_ENABLED, true),
  kundenOfflineQueueEnabled: parseBoolean(process.env.NEXT_PUBLIC_KUNDEN_OFFLINE_QUEUE_ENABLED, true),
  kundenDuplicateDetectionEnabled: parseBoolean(process.env.NEXT_PUBLIC_KUNDEN_DUPLICATE_DETECTION_ENABLED, true),
  kundenSlaEngineEnabled: parseBoolean(process.env.NEXT_PUBLIC_KUNDEN_SLA_ENGINE_ENABLED, true),
};

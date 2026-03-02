import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../src/context/AuthContext';
import { apiGet } from '../../src/lib/api';
import { getLastSyncTimestamp, setLastSyncTimestamp } from '../../src/lib/storage';
import { runSyncCycle, type SyncTransport } from '../../src/sync/syncClient';
import { ensureDeviceKeyReference } from '../../src/storage/encryptedDb';

type OnboardingStatusResponse = {
  workspaceId: string | null;
};

function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export default function SyncScreen() {
  const { accessToken } = useAuth();

  const [loadingLastSync, setLoadingLastSync] = useState(true);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [syncPending, setSyncPending] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stubTransport = useMemo<SyncTransport>(
    () => ({
      pushChanges: async (request) => {
        console.log('[sync-stub] pushChanges', {
          tenantId: request.tenantId,
          deviceId: request.deviceId,
          operationCount: request.operations.length
        });
        return { acceptedOperationIds: request.operations.map((operation) => operation.clientOpId) };
      },
      pullChanges: async (request) => {
        console.log('[sync-stub] pullChanges', {
          tenantId: request.tenantId,
          deviceId: request.deviceId,
          sinceCursor: request.sinceCursor
        });
        return {
          nextCursor: new Date().toISOString(),
          changes: []
        };
      }
    }),
    []
  );

  useEffect(() => {
    async function loadLastSync(): Promise<void> {
      try {
        const value = await getLastSyncTimestamp();
        setLastSyncAt(value);
      } finally {
        setLoadingLastSync(false);
      }
    }

    void loadLastSync();
  }, []);

  const startSync = async () => {
    if (!accessToken) {
      setError('Kein Zugriffstoken verfügbar.');
      return;
    }

    setSyncPending(true);
    setSyncMessage(null);
    setError(null);

    try {
      const [onboarding, deviceId] = await Promise.all([
        apiGet<OnboardingStatusResponse>('/v1/onboarding/status', accessToken),
        ensureDeviceKeyReference()
      ]);

      const tenantId = onboarding.workspaceId ?? 'tenant-local';
      const result = await runSyncCycle(stubTransport, {
        tenantId,
        deviceId,
        sinceCursor: lastSyncAt ?? '0',
        pendingOperations: [],
        vectorClock: {}
      });

      await setLastSyncTimestamp(result.nextCursor);
      setLastSyncAt(result.nextCursor);
      setSyncMessage(`Sync abgeschlossen: ${result.changes.length} Änderungen geladen.`);
    } catch (err) {
      setError(toErrorMessage(err, 'Sync fehlgeschlagen.'));
    } finally {
      setSyncPending(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Sync</Text>
      <Text style={styles.subtitle}>Stub-Transport aktiv. gRPC folgt in P4.4.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Letzter Sync</Text>
        {loadingLastSync ? (
          <ActivityIndicator size="small" color="#0f766e" />
        ) : (
          <Text style={styles.value}>{lastSyncAt ?? 'Noch nicht synchronisiert'}</Text>
        )}
      </View>

      {syncMessage ? <Text style={styles.success}>{syncMessage}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        onPress={() => void startSync()}
        disabled={syncPending}
        style={({ pressed }) => [styles.button, (pressed || syncPending) && styles.buttonPressed]}
      >
        {syncPending ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Sync starten</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f8fafc',
    gap: 12
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a'
  },
  subtitle: {
    fontSize: 14,
    color: '#475569'
  },
  card: {
    marginTop: 6,
    borderRadius: 16,
    padding: 18,
    backgroundColor: '#ffffff',
    gap: 8,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2
  },
  label: {
    fontSize: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#64748b'
  },
  value: {
    fontSize: 15,
    color: '#0f172a'
  },
  success: {
    color: '#166534',
    fontSize: 14
  },
  error: {
    color: '#b91c1c',
    fontSize: 14
  },
  button: {
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: '#0f766e',
    paddingVertical: 12,
    alignItems: 'center'
  },
  buttonPressed: {
    opacity: 0.85
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600'
  }
});

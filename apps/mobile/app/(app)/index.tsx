import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../src/context/AuthContext';
import { apiGet } from '../../src/lib/api';

type WorkspaceResponse = {
  id: string;
  name: string;
  city?: string | null;
  memberCount: number;
};

type BillingSummaryResponse = {
  plan?: {
    code?: string | null;
  } | null;
};

type OnboardingStatusResponse = {
  authenticated: boolean;
  workspaceId: string | null;
  subscription?: {
    planCode?: string | null;
  } | null;
};

function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export default function DashboardScreen() {
  const { accessToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceResponse | null>(null);
  const [planCode, setPlanCode] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!accessToken) {
      setWorkspace(null);
      setPlanCode(null);
      setError('Kein Zugriffstoken verfügbar.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let nextWorkspace: WorkspaceResponse | null = null;
    let fallbackPlanCode: string | null = null;

    try {
      nextWorkspace = await apiGet<WorkspaceResponse>('/v1/workspace/me', accessToken);
    } catch (workspaceError) {
      try {
        const onboarding = await apiGet<OnboardingStatusResponse>('/v1/onboarding/status', accessToken);
        fallbackPlanCode = onboarding.subscription?.planCode ?? null;

        if (onboarding.authenticated && onboarding.workspaceId) {
          nextWorkspace = {
            id: onboarding.workspaceId,
            name: 'Arbeitsbereich',
            city: null,
            memberCount: 0
          };
        }
      } catch {
        // Use original workspace error below.
      }

      if (!nextWorkspace) {
        setError(toErrorMessage(workspaceError, 'Dashboard konnte nicht geladen werden.'));
      }
    }

    try {
      const billing = await apiGet<BillingSummaryResponse>('/v1/billing/summary', accessToken);
      setPlanCode(billing.plan?.code ?? fallbackPlanCode);
    } catch {
      setPlanCode(fallbackPlanCode);
    }

    setWorkspace(nextWorkspace);
    setLoading(false);
  }, [accessToken]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Dashboard</Text>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#0f766e" />
        </View>
      ) : null}

      {!loading && error ? <Text style={styles.error}>{error}</Text> : null}

      {!loading && workspace ? (
        <View style={styles.card}>
          <Text style={styles.label}>Workspace</Text>
          <Text style={styles.value}>{workspace.name}</Text>

          <Text style={styles.label}>Ort</Text>
          <Text style={styles.value}>{workspace.city ?? 'Nicht hinterlegt'}</Text>

          <Text style={styles.label}>Mitglieder</Text>
          <Text style={styles.value}>{workspace.memberCount}</Text>

          <Text style={styles.label}>Plan</Text>
          <Text style={styles.value}>{planCode ?? 'Unbekannt'}</Text>
        </View>
      ) : null}

      <Pressable style={styles.button} onPress={() => void loadDashboard()}>
        <Text style={styles.buttonText}>Neu laden</Text>
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
  loadingState: {
    marginTop: 24,
    alignItems: 'center'
  },
  error: {
    color: '#b91c1c',
    fontSize: 14
  },
  card: {
    marginTop: 8,
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
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a'
  },
  button: {
    marginTop: 12,
    borderRadius: 10,
    backgroundColor: '#0f766e',
    paddingVertical: 12,
    alignItems: 'center'
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600'
  }
});

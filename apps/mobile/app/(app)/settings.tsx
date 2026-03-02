import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../src/context/AuthContext';
import { apiGet } from '../../src/lib/api';

type OnboardingStatusResponse = {
  email: string | null;
};

export default function SettingsScreen() {
  const { accessToken, logout, userId } = useAuth();

  const [email, setEmail] = useState<string | null>(null);
  const [loadingEmail, setLoadingEmail] = useState(true);
  const [logoutPending, setLogoutPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const version = Constants.expoConfig?.version ?? '0.0.0';

  useEffect(() => {
    async function loadEmail(): Promise<void> {
      if (!accessToken) {
        setLoadingEmail(false);
        return;
      }

      try {
        const status = await apiGet<OnboardingStatusResponse>('/v1/onboarding/status', accessToken);
        setEmail(status.email ?? null);
      } catch {
        setEmail(null);
      } finally {
        setLoadingEmail(false);
      }
    }

    void loadEmail();
  }, [accessToken]);

  const handleLogout = async () => {
    setLogoutPending(true);
    setError(null);
    try {
      await logout();
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : 'Logout fehlgeschlagen.');
    } finally {
      setLogoutPending(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Einstellungen</Text>

      <View style={styles.card}>
        <Text style={styles.label}>E-Mail</Text>
        {loadingEmail ? (
          <ActivityIndicator size="small" color="#0f766e" />
        ) : (
          <Text style={styles.value}>{email ?? 'Nicht verfügbar'}</Text>
        )}

        <Text style={styles.label}>Benutzer-ID</Text>
        <Text style={styles.value}>{userId ?? 'Nicht verfügbar'}</Text>

        <Text style={styles.label}>App-Version</Text>
        <Text style={styles.value}>{version}</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        onPress={() => void handleLogout()}
        disabled={logoutPending}
        style={({ pressed }) => [styles.button, (pressed || logoutPending) && styles.buttonPressed]}
      >
        {logoutPending ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.buttonText}>Abmelden</Text>
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
    fontSize: 15,
    color: '#0f172a'
  },
  error: {
    color: '#b91c1c',
    fontSize: 14
  },
  button: {
    marginTop: 8,
    borderRadius: 10,
    backgroundColor: '#991b1b',
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

import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

import { useAuth } from '../../src/context/AuthContext';

function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export default function MfaScreen() {
  const router = useRouter();
  const { status, verifyMfa } = useAuth();
  const params = useLocalSearchParams<{ userId?: string; mfaToken?: string }>();

  const userId = useMemo(
    () => (typeof params.userId === 'string' ? params.userId : ''),
    [params.userId]
  );
  const mfaToken = useMemo(
    () => (typeof params.mfaToken === 'string' ? params.mfaToken : ''),
    [params.mfaToken]
  );

  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === 'authenticated') {
    return <Redirect href="/(app)" />;
  }

  if (!userId || !mfaToken) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>MFA-Kontext fehlt. Bitte erneut anmelden.</Text>
        <Pressable style={styles.linkButton} onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.linkButtonText}>Zur Anmeldung</Text>
        </Pressable>
      </View>
    );
  }

  const submit = async () => {
    setError(null);

    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setError('Bitte den 6-stelligen Code eingeben.');
      return;
    }

    setPending(true);
    try {
      await verifyMfa(userId, mfaToken, trimmedCode);
      router.replace('/(app)');
    } catch (err) {
      setError(toErrorMessage(err, 'Code ungültig. Bitte erneut versuchen.'));
    } finally {
      setPending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Zwei-Faktor-Code</Text>
        <Text style={styles.subtitle}>Bitte den Code aus deiner Authenticator-App eingeben.</Text>

        <TextInput
          style={styles.input}
          autoCorrect={false}
          autoCapitalize="none"
          inputMode="numeric"
          keyboardType="number-pad"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          value={code}
          onChangeText={setCode}
          editable={!pending}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          onPress={submit}
          disabled={pending}
          style={({ pressed }) => [styles.button, (pressed || pending) && styles.buttonPressed]}
        >
          {pending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Bestätigen</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f1f5f9'
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 24,
    backgroundColor: '#f1f5f9'
  },
  card: {
    width: '100%',
    maxWidth: 480,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    gap: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0f172a'
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 4
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 22,
    letterSpacing: 8,
    textAlign: 'center',
    backgroundColor: '#ffffff'
  },
  button: {
    marginTop: 6,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: '#0f766e'
  },
  buttonPressed: {
    opacity: 0.85
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600'
  },
  error: {
    color: '#b91c1c',
    fontSize: 13
  },
  linkButton: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#0f766e'
  },
  linkButtonText: {
    color: '#ffffff',
    fontWeight: '600'
  }
});

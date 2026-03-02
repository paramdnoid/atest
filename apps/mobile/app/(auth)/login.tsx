import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
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

export default function LoginScreen() {
  const router = useRouter();
  const { status, login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === 'authenticated') {
    return <Redirect href="/(app)" />;
  }

  const submit = async () => {
    setError(null);

    if (!email.trim() || !password) {
      setError('Bitte E-Mail und Passwort eingeben.');
      return;
    }

    setPending(true);
    try {
      const result = await login(email.trim(), password);
      if (result.needsMfa) {
        router.push({
          pathname: '/(auth)/mfa',
          params: {
            userId: result.userId,
            mfaToken: result.mfaToken
          }
        });
        return;
      }

      router.replace('/(app)');
    } catch (err) {
      setError(toErrorMessage(err, 'Anmeldung fehlgeschlagen.'));
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
        <Text style={styles.title}>Anmelden</Text>
        <Text style={styles.subtitle}>Melde dich mit deinem Zunftgewerk-Konto an.</Text>

        <TextInput
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          placeholder="E-Mail"
          value={email}
          onChangeText={setEmail}
          editable={!pending}
        />

        <TextInput
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="password"
          secureTextEntry
          placeholder="Passwort"
          value={password}
          onChangeText={setPassword}
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
            <Text style={styles.buttonText}>Anmelden</Text>
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
    fontSize: 16,
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
  }
});

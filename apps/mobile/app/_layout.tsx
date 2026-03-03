import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '../src/context/AuthContext';
import { ensureDeviceKeyReference } from '../src/storage/encryptedDb';

export default function RootLayout() {
  useEffect(() => {
    void ensureDeviceKeyReference();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Slot />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

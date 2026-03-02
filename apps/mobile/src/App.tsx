import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaView } from 'react-native';
import { HomeScreen } from './screens/HomeScreen';
import { ensureDeviceKeyReference } from './storage/encryptedDb';

export default function App() {
  useEffect(() => {
    void ensureDeviceKeyReference();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <HomeScreen />
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

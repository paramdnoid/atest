import { Pressable, StyleSheet, Text, View } from 'react-native';

export function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Zunftgewerk Mobile</Text>
      <Text style={styles.subtitle}>Offline-first mit verschluesselter lokaler Datenhaltung und deterministischem Sync.</Text>
      <Pressable style={styles.button}>
        <Text style={styles.buttonText}>Sync starten</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 24,
    justifyContent: 'center'
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#0f172a'
  },
  subtitle: {
    marginTop: 12,
    fontSize: 15,
    color: '#334155',
    lineHeight: 22
  },
  button: {
    marginTop: 24,
    backgroundColor: '#0369a1',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center'
  },
  buttonText: {
    color: 'white',
    fontWeight: '600'
  }
});

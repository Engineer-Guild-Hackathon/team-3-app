import React, { useState } from 'react';
import { Text, Button, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

const API_BASE = Constants.expoConfig?.extra?.apiBase ?? 'http://127.0.0.1:3000';

export default function App() {
  const [status, setStatus] = useState('未接続');

  const pingApi = async () => {
    try {
      setStatus('通信中...');
      const res = await fetch(`${API_BASE}/api/v1/push/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: 'dev-simulator', platform: 'android', token: 'dummy-token' }),
      });
      if (res.status !== 204 && !res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      setStatus('成功 (204)');
    } catch (e) {
      setStatus(`失敗: ${String(e?.message ?? e)}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>SPAR Mobile (接続テスト)</Text>
      <Text style={styles.text}>API ベース: {API_BASE}</Text>
      <Button title="/api/v1/push/register を呼び出す" onPress={pingApi} />
      <Text style={styles.status}>{status}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  text: {
    fontSize: 14,
    color: '#555',
  },
  status: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
});

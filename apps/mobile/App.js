import React, { useMemo, useState } from 'react';
import { Text, Button, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { createMobileApiClient } from '@team3/api-client';

const extras = Constants.expoConfig?.extra ?? {};
const API_BASE = extras.apiBase ?? 'http://127.0.0.1:3000';
const DEV_APP_JWT = extras.devAppJwt ?? null;

export default function App() {
  const [status, setStatus] = useState('未接続');

  const apiClient = useMemo(
    () =>
      createMobileApiClient({
        baseUrl: API_BASE,
        getAccessToken: () => DEV_APP_JWT,
      }),
    [API_BASE, DEV_APP_JWT]
  );

  const pingApi = async () => {
    try {
      setStatus('通信中...');
      await apiClient.registerPushToken({
        deviceId: 'dev-simulator',
        platform: 'android',
        token: 'dummy-token',
      });
      setStatus('成功 (204)');
    } catch (e) {
      setStatus(`失敗: ${String(e?.message ?? e)}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>SPAR Mobile (接続テスト)</Text>
      <Text style={styles.text}>API ベース: {API_BASE}</Text>
      <Text style={styles.text}>Dev Token: {DEV_APP_JWT ? '設定済み' : '未設定'}</Text>
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

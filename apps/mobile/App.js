import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, Button, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { createMobileApiClient } from '@team3/api-client';

const extras = Constants.expoConfig?.extra ?? {};
const API_BASE = extras.apiBase ?? 'http://127.0.0.1:3000';
const DEV_AUTH_CODE = extras.devAuthCode ?? null;
const DEFAULT_DEVICE_ID = extras.deviceId ?? 'dev-simulator';
const DEFAULT_PLATFORM = extras.platform ?? (Platform.OS === 'ios' ? 'ios' : 'android');
const PUSH_DEMO_TOKEN = extras.pushDemoToken ?? 'dummy-token';
const APP_SCHEME = extras.scheme ?? 'spar';
const AUTH_STORAGE_KEY = 'spar.auth.tokens';
const DEVICE_ID_STORAGE_KEY = 'spar.device.id';
const EAS_PROJECT_ID = extras.easProjectId ?? Constants.easConfig?.projectId ?? null;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [status, setStatus] = useState('未接続');
  const [auth, setAuth] = useState(null);
  const [deviceId, setDeviceId] = useState(DEFAULT_DEVICE_ID);
  const [pushToken, setPushToken] = useState(null);
  const [hasPushPermission, setHasPushPermission] = useState(false);

  const apiClient = useMemo(
    () =>
      createMobileApiClient({
        baseUrl: API_BASE,
        getAccessToken: () => auth?.accessToken ?? null,
      }),
    [API_BASE, auth?.accessToken]
  );

  const restoreAuthFromStorage = useCallback(async () => {
    try {
      const storedDeviceId = await SecureStore.getItemAsync(DEVICE_ID_STORAGE_KEY);
      if (storedDeviceId) {
        setDeviceId(storedDeviceId);
      }
      const stored = await SecureStore.getItemAsync(AUTH_STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      setAuth(parsed);
      setStatus('ローカル保存のトークンを復元しました');
    } catch (error) {
      console.warn('Failed to restore auth tokens', error);
    }
  }, []);

  useEffect(() => {
    restoreAuthFromStorage();
  }, [restoreAuthFromStorage]);

  const ensureDeviceId = useCallback(async () => {
    const current = await SecureStore.getItemAsync(DEVICE_ID_STORAGE_KEY);
    if (current) {
      setDeviceId(current);
      return current;
    }
    const generated = DEFAULT_DEVICE_ID || Crypto.randomUUID();
    await SecureStore.setItemAsync(DEVICE_ID_STORAGE_KEY, generated);
    setDeviceId(generated);
    return generated;
  }, []);

  const persistAuth = useCallback(async (tokens) => {
    const snapshot = { ...tokens, storedAt: Date.now() };
    await SecureStore.setItemAsync(AUTH_STORAGE_KEY, JSON.stringify(snapshot));
    setAuth(snapshot);
  }, []);

  const clearAuth = useCallback(async () => {
    await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
    setAuth(null);
  }, []);

  const performLogin = useCallback(async () => {
    setStatus('認証開始...');
    try {
      const start = await apiClient.send('/api/v1/auth/start');
      const currentDeviceId = await ensureDeviceId();
      let authorizationCode = DEV_AUTH_CODE ?? null;
      let codeVerifier;
      let state;

      if (!authorizationCode) {
        const redirectUri = AuthSession.makeRedirectUri({ scheme: APP_SCHEME, path: 'auth/callback' });
        const request = new AuthSession.AuthRequest({
          clientId: start.clientId,
          scopes: typeof start.scope === 'string' ? start.scope.split(/\s+/).filter(Boolean) : ['openid', 'profile', 'email'],
          redirectUri,
          responseType: 'code',
          codeChallengeMethod: start.codeChallengeMethod ?? 'S256',
        });
        const discovery = { authorizationEndpoint: start.authorizationEndpoint };
        const result = await request.promptAsync(discovery, { useProxy: false });
        if (result.type !== 'success' || !result.params?.code) {
          throw new Error(result.type === 'dismiss' ? 'User dismissed authentication.' : 'Authorization failed.');
        }
        authorizationCode = result.params.code;
        state = result.params.state;
        codeVerifier = request.codeVerifier;
      }

      if (!authorizationCode) {
        throw new Error('Authorization code was not obtained.');
      }

      const callbackParams = new URLSearchParams({ code: authorizationCode, deviceId: currentDeviceId });
      if (state) {
        callbackParams.set('state', state);
      }
      const tokens = await apiClient.send(`/api/v1/auth/callback?${callbackParams.toString()}`, {
        headers: codeVerifier ? { 'x-code-verifier': codeVerifier } : undefined,
      });
      await persistAuth(tokens);
      setStatus('ログインに成功しました');
    } catch (error) {
      setStatus(`ログイン失敗: ${error.message ?? String(error)}`);
    }
  }, [apiClient, ensureDeviceId, persistAuth]);

  const performRefresh = useCallback(async () => {
    if (!auth) {
      setStatus('リフレッシュ対象がありません');
      return;
    }
    setStatus('リフレッシュ実行中...');
    try {
      const tokens = await apiClient.send('/api/v1/auth/refresh', {
        method: 'POST',
        body: {
          refreshToken: auth.refreshToken,
          deviceId: auth.deviceId ?? deviceId,
        },
      });
      await persistAuth(tokens);
      setStatus('トークンを更新しました');
    } catch (error) {
      setStatus(`リフレッシュ失敗: ${error.message ?? String(error)}`);
    }
  }, [apiClient, auth, deviceId, persistAuth]);

  const registerPush = useCallback(async () => {
    const targetDeviceId = auth?.deviceId ?? deviceId;
    if (!auth?.accessToken) {
      setStatus('Push 登録にはログインが必要です');
      return;
    }
    const tokenToSend = pushToken ?? PUSH_DEMO_TOKEN;
    if (!pushToken) {
      setStatus('Push トークンを取得できていません (ダミー値で登録します)');
    }
    setStatus('Push トークン登録中...');
    try {
      await apiClient.registerPushToken({
        deviceId: targetDeviceId,
        platform: DEFAULT_PLATFORM,
        token: tokenToSend,
      });
      setStatus('Push トークン登録に成功しました');
    } catch (error) {
      setStatus(`Push 登録失敗: ${error.message ?? String(error)}`);
    }
  }, [apiClient, auth, deviceId, pushToken]);

  const performLogout = useCallback(async () => {
    await clearAuth();
    setStatus('ログアウトしました');
  }, [clearAuth]);

  const registerForPushToken = useCallback(async () => {
    if (!Device.isDevice) {
      setStatus('Push トークンはエミュレータで取得できません');
      setHasPushPermission(false);
      setPushToken(null);
      return null;
    }
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      setHasPushPermission(false);
      setPushToken(null);
      return null;
    }
    setHasPushPermission(true);

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const expoTokenResult = await Notifications.getExpoPushTokenAsync(
      EAS_PROJECT_ID ? { projectId: EAS_PROJECT_ID } : undefined
    );
    setPushToken(expoTokenResult.data);
    return expoTokenResult.data;
  }, []);

  useEffect(() => {
    registerForPushToken();
  }, [registerForPushToken]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>SPAR Mobile (認証テスト)</Text>
      <Text style={styles.text}>API ベース: {API_BASE}</Text>
      <Text style={styles.text}>デバイス ID: {deviceId}</Text>
      <Text style={styles.text}>アクセストークン: {auth ? '取得済み' : '未取得'}</Text>
      <Text style={styles.text}>
        Push トークン: {pushToken ? `${pushToken.slice(0, 12)}...` : hasPushPermission ? '未取得' : '未許可'}
      </Text>
      <Button title="ログイン (OIDC/DEV)" onPress={performLogin} />
      <Button title="トークン更新" onPress={performRefresh} disabled={!auth} />
      <Button title="Push トークン登録" onPress={registerPush} disabled={!auth} />
      <Button title="ログアウト" onPress={performLogout} disabled={!auth} />
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

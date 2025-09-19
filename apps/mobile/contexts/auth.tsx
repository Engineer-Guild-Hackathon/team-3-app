import * as React from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import * as AuthSession from 'expo-auth-session';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as Crypto from 'expo-crypto';
import { createMobileApiClient, type MobileApiClient } from '@team3/api-client';

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn?: number;
  refreshTokenExpiresAt?: string;
  deviceId?: string;
  storedAt: number;
};

type UserProfile = {
  id?: string;
  email?: string | null;
  displayName?: string | null;
};

type AuthContextValue = {
  auth: AuthTokens | null;
  deviceId: string | null;
  statusMessage: string;
  isInitializing: boolean;
  isAuthenticated: boolean;
  pushToken: string | null;
  hasPushPermission: boolean;
  profile: UserProfile | null;
  apiClient: MobileApiClient;
  login: () => Promise<void>;
  logout: (message?: string) => Promise<void>;
  refresh: () => Promise<void>;
  registerPushToken: () => Promise<void>;
  reloadProfile: () => Promise<void>;
  setStatus: (message: string) => void;
  reauthenticate: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

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
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function sanitizeDeviceId(source?: string | null): string | null {
  if (typeof source !== 'string') {
    return null;
  }
  const trimmed = source.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseAuthTokens(raw: string | null): AuthTokens | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.accessToken === 'string' && typeof parsed.refreshToken === 'string') {
      return parsed as AuthTokens;
    }
  } catch {
    // noop: 不正データは破棄
  }
  return null;
}

function buildStatusMessage(error: unknown, fallback: string): string {
  if (!error) return fallback;
  if (error instanceof Error) {
    return `${fallback}: ${error.message}`;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') {
      return `${fallback}: ${message}`;
    }
  }
  return `${fallback}: ${String(error)}`;
}

function ensureJson<T>(value: T | Response): T {
  if (value instanceof Response) {
    throw new Error('Unexpected response format');
  }
  return value;
}

export type AuthProviderProps = {
  children: React.ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [auth, setAuth] = React.useState<AuthTokens | null>(null);
  const [deviceId, setDeviceId] = React.useState<string | null>(DEFAULT_DEVICE_ID);
  const [statusMessage, setStatusMessage] = React.useState<string>('未接続');
  const [isInitializing, setIsInitializing] = React.useState(true);
  const [pushToken, setPushToken] = React.useState<string | null>(null);
  const [hasPushPermission, setHasPushPermission] = React.useState(false);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const reauthPromiseRef = React.useRef<Promise<void> | null>(null);

  const apiClient = React.useMemo(() => {
    return createMobileApiClient({
      baseUrl: API_BASE,
      getAccessToken: () => auth?.accessToken ?? null,
    });
  }, [auth?.accessToken]);

  const setStatus = React.useCallback((message: string) => {
    setStatusMessage(message);
  }, []);

  const ensureDeviceId = React.useCallback(async () => {
    const stored = await SecureStore.getItemAsync(DEVICE_ID_STORAGE_KEY);
    if (stored) {
      setDeviceId(stored);
      return stored;
    }
    const generated = DEFAULT_DEVICE_ID ?? Crypto.randomUUID();
    await SecureStore.setItemAsync(DEVICE_ID_STORAGE_KEY, generated);
    setDeviceId(generated);
    return generated;
  }, []);

  const persistAuth = React.useCallback(async (tokens: AuthTokens | null) => {
    if (!tokens) {
      await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
      setAuth(null);
      return;
    }
    const snapshot: AuthTokens = { ...tokens, storedAt: Date.now() };
    await SecureStore.setItemAsync(AUTH_STORAGE_KEY, JSON.stringify(snapshot));
    setAuth(snapshot);
  }, []);

  const clearAuthState = React.useCallback(
    async (message?: string) => {
      await persistAuth(null);
      setProfile(null);
      if (message) {
        setStatus(message);
      }
    },
    [persistAuth, setStatus],
  );

  const restoreAuthFromStorage = React.useCallback(async () => {
    setIsInitializing(true);
    try {
      const storedDeviceId = await SecureStore.getItemAsync(DEVICE_ID_STORAGE_KEY);
      if (storedDeviceId) {
        setDeviceId(storedDeviceId);
      }
      const stored = await SecureStore.getItemAsync(AUTH_STORAGE_KEY);
      const parsed = parseAuthTokens(stored);
      if (parsed) {
        setAuth(parsed);
        setStatus('ローカル保存のトークンを復元しました');
      } else {
        setAuth(null);
      }
    } catch (error) {
      setStatus(buildStatusMessage(error, '認証情報の復元に失敗しました'));
      setAuth(null);
    } finally {
      setIsInitializing(false);
    }
  }, [setStatus]);

  const loadProfile = React.useCallback(async () => {
    if (!auth?.accessToken) {
      setProfile(null);
      return;
    }
    try {
      const raw = await apiClient.send<{ profile?: UserProfile } | undefined>('/api/v1/me');
      const data = ensureJson(raw);
      if (data && typeof data === 'object' && data?.profile) {
        setProfile(data.profile ?? null);
      } else {
        setProfile(null);
      }
    } catch (error) {
      setStatus(buildStatusMessage(error, 'プロフィール取得に失敗しました'));
    }
  }, [apiClient, auth?.accessToken, setStatus]);

  const registerForPushToken = React.useCallback(async () => {
    if (!Device.isDevice) {
      setStatus('Push トークンはエミュレータで取得できません');
      setHasPushPermission(false);
      setPushToken(null);
      return null;
    }
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const response = await Notifications.requestPermissionsAsync();
        finalStatus = response.status;
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

      const tokenResult = await Notifications.getExpoPushTokenAsync(
        EAS_PROJECT_ID ? { projectId: EAS_PROJECT_ID } : undefined,
      );
      setPushToken(tokenResult.data);
      return tokenResult.data;
    } catch (error) {
      setStatus(buildStatusMessage(error, 'Push トークン取得に失敗しました'));
      setPushToken(null);
      setHasPushPermission(false);
      return null;
    }
  }, [setStatus]);

  const registerPushToken = React.useCallback(async () => {
    const targetDeviceId = sanitizeDeviceId(auth?.deviceId) ?? deviceId ?? (await ensureDeviceId());
    if (!auth?.accessToken) {
      setStatus('Push 登録にはログインが必要です');
      return;
    }
    const tokenToSend = pushToken ?? PUSH_DEMO_TOKEN;
    if (!pushToken) {
      setStatus('Push トークンを取得できていません (ダミー値で登録します)');
    }
    try {
      await apiClient.registerPushToken({
        deviceId: targetDeviceId ?? DEFAULT_DEVICE_ID ?? 'dev-simulator',
        platform: DEFAULT_PLATFORM,
        token: tokenToSend,
      });
      setStatus('Push トークン登録に成功しました');
    } catch (error) {
      setStatus(buildStatusMessage(error, 'Push 登録に失敗しました'));
    }
  }, [apiClient, auth?.accessToken, auth?.deviceId, deviceId, ensureDeviceId, pushToken, setStatus]);

  const logout = React.useCallback(
    async (message: string = 'ログアウトしました') => {
      await clearAuthState(message);
    },
    [clearAuthState],
  );

  const refresh = React.useCallback(async () => {
    if (!auth?.refreshToken) {
      setStatus('リフレッシュ対象がありません');
      return;
    }
    setStatus('リフレッシュ実行中...');
    try {
      const tokensRaw = await apiClient.send<AuthTokens>('/api/v1/auth/refresh', {
        method: 'POST',
        body: {
          refreshToken: auth.refreshToken,
          deviceId: auth.deviceId ?? deviceId,
        },
      });
      const tokens = ensureJson(tokensRaw);
      await persistAuth(tokens);
      setStatus('トークンを更新しました');
      await loadProfile();
    } catch (error) {
      const message = buildStatusMessage(error, 'リフレッシュに失敗しました');
      await clearAuthState(message);
    }
  }, [apiClient, auth, clearAuthState, deviceId, loadProfile, persistAuth, setStatus]);

  const login = React.useCallback(async () => {
    setStatus('認証開始...');
    try {
      const startRaw = await apiClient.send<{ authorizationEndpoint?: string; clientId?: string; scope?: string | string[]; codeChallengeMethod?: string }>('/api/v1/auth/start');
      const start = ensureJson(startRaw);
      const currentDeviceId = await ensureDeviceId();
      let authorizationCode = DEV_AUTH_CODE ?? null;
      let codeVerifier: string | undefined;
      let state: string | undefined;

      if (!authorizationCode) {
        const redirectUri = AuthSession.makeRedirectUri({ scheme: APP_SCHEME, path: 'auth/callback' });
        const request = new AuthSession.AuthRequest({
          clientId: start?.clientId ?? '',
          scopes:
            typeof start?.scope === 'string'
              ? start.scope.split(/\s+/).filter(Boolean)
              : Array.isArray(start?.scope)
              ? start.scope.filter((scope): scope is string => typeof scope === 'string')
              : ['openid', 'profile', 'email'],
          redirectUri,
          responseType: 'code',
          codeChallengeMethod: (start?.codeChallengeMethod ?? 'S256') as AuthSession.CodeChallengeMethod,
        });
        const discovery = { authorizationEndpoint: start?.authorizationEndpoint ?? '' };
        const result = await request.promptAsync(discovery as any, { useProxy: false } as any);
        if (result.type !== 'success' || !result.params?.code) {
          throw new Error(result.type === 'dismiss' ? '認証をキャンセルしました' : '認証に失敗しました');
        }
        authorizationCode = result.params.code;
        state = typeof result.params.state === 'string' ? result.params.state : undefined;
        codeVerifier = request.codeVerifier;
      }

      if (!authorizationCode) {
        throw new Error('認可コードを取得できませんでした');
      }

      const callbackParams = new URLSearchParams({ code: authorizationCode, deviceId: currentDeviceId ?? '' });
      if (state) {
        callbackParams.set('state', state);
      }

      const tokensRaw = await apiClient.send<AuthTokens>(`/api/v1/auth/callback?${callbackParams.toString()}`, {
        headers: codeVerifier ? { 'x-code-verifier': codeVerifier } : undefined,
      });
      const tokens = ensureJson(tokensRaw);
      await persistAuth(tokens);
      setStatus('ログインに成功しました');
      await loadProfile();
      if (pushToken || hasPushPermission) {
        await registerPushToken();
      }
    } catch (error) {
      setStatus(buildStatusMessage(error, 'ログインに失敗しました'));
    }
  }, [apiClient, ensureDeviceId, hasPushPermission, loadProfile, persistAuth, pushToken, registerPushToken, setStatus]);

  const reauthenticate = React.useCallback(async () => {
    if (reauthPromiseRef.current) {
      await reauthPromiseRef.current;
      return;
    }
    const task = (async () => {
      await clearAuthState('セッションの有効期限が切れました。再ログインしてください');
      try {
        await login();
      } catch (error) {
        setStatus(buildStatusMessage(error, '再ログインに失敗しました'));
        throw error;
      }
    })().finally(() => {
      reauthPromiseRef.current = null;
    });
    reauthPromiseRef.current = task;
    await task;
  }, [clearAuthState, login, setStatus]);

  React.useEffect(() => {
    restoreAuthFromStorage();
  }, [restoreAuthFromStorage]);

  React.useEffect(() => {
    registerForPushToken();
  }, [registerForPushToken]);

  React.useEffect(() => {
    if (!auth?.accessToken) {
      setProfile(null);
      return;
    }
    loadProfile();
  }, [auth?.accessToken, loadProfile]);

  const value: AuthContextValue = React.useMemo(
    () => ({
      auth,
      deviceId,
      statusMessage,
      isInitializing,
      isAuthenticated: Boolean(auth?.accessToken),
      pushToken,
      hasPushPermission,
      profile,
      apiClient,
      login,
      logout,
      refresh,
      registerPushToken,
      reloadProfile: loadProfile,
      setStatus,
      reauthenticate,
    }),
    [
      apiClient,
      auth,
      deviceId,
      hasPushPermission,
      isInitializing,
      loadProfile,
      login,
      logout,
      profile,
      pushToken,
      refresh,
      registerPushToken,
      reauthenticate,
      setStatus,
      statusMessage,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth は AuthProvider 内で使用してください');
  }
  return context;
};

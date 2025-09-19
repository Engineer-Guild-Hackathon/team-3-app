const TOKEN_STORAGE_KEY = 'spar:web:appjwt';
const DEVICE_STORAGE_KEY = 'spar:web:device-id';
const ACCESS_EXPIRY_BUFFER_MS = 5_000;

export type StoredWebTokens = {
  accessToken: string;
  accessTokenExpiresAt: number;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  deviceId: string;
};

type TokensResponse = {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresAt: string;
  deviceId: string;
};

let memoryTokens: StoredWebTokens | null = null;
let refreshPromise: Promise<StoredWebTokens | null> | null = null;

function isBrowser() {
  return typeof window !== 'undefined';
}

function loadFromStorage(): StoredWebTokens | null {
  if (!isBrowser()) return null;
  if (memoryTokens) return memoryTokens;
  try {
    const raw = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredWebTokens;
    memoryTokens = parsed;
    return parsed;
  } catch {
    return null;
  }
}

function saveToStorage(tokens: StoredWebTokens | null) {
  if (!isBrowser()) return;
  if (!tokens) {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    memoryTokens = null;
    return;
  }
  memoryTokens = tokens;
  window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
}

function ensureDeviceId(): string {
  if (!isBrowser()) return 'web-device';
  try {
    const existing = window.localStorage.getItem(DEVICE_STORAGE_KEY);
    if (existing) return existing;
    const generated = `web-${crypto.randomUUID()}`;
    window.localStorage.setItem(DEVICE_STORAGE_KEY, generated);
    return generated;
  } catch {
    return 'web-device';
  }
}

function isAccessExpired(tokens: StoredWebTokens | null): boolean {
  if (!tokens) return true;
  return Date.now() >= tokens.accessTokenExpiresAt - ACCESS_EXPIRY_BUFFER_MS;
}

function isRefreshExpired(tokens: StoredWebTokens | null): boolean {
  if (!tokens) return true;
  const expires = Date.parse(tokens.refreshTokenExpiresAt);
  if (Number.isNaN(expires)) return true;
  return Date.now() >= expires - 60_000;
}

async function callWebTokenEndpoint(deviceId: string): Promise<TokensResponse> {
  const response = await fetch('/api/v1/auth/web-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId }),
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`Failed to issue web token (${response.status})`);
  }
  return (await response.json()) as TokensResponse;
}

async function callRefreshEndpoint(tokens: StoredWebTokens): Promise<TokensResponse> {
  const response = await fetch('/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: tokens.refreshToken, deviceId: tokens.deviceId }),
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`Failed to refresh token (${response.status})`);
  }
  return (await response.json()) as TokensResponse;
}

function tokensFromResponse(payload: TokensResponse): StoredWebTokens {
  return {
    accessToken: payload.accessToken,
    accessTokenExpiresAt: Date.now() + payload.accessTokenExpiresIn * 1000,
    refreshToken: payload.refreshToken,
    refreshTokenExpiresAt: payload.refreshTokenExpiresAt,
    deviceId: payload.deviceId,
  };
}

async function fetchFreshTokens(forceNew: boolean): Promise<StoredWebTokens | null> {
  const deviceId = ensureDeviceId();
  const current = loadFromStorage();
  if (!forceNew && current && !isRefreshExpired(current) && !isAccessExpired(current)) {
    return current;
  }
  if (refreshPromise) {
    return refreshPromise;
  }
  refreshPromise = (async () => {
    try {
      const base = loadFromStorage();
      let next: StoredWebTokens;
      if (!forceNew && base && !isRefreshExpired(base)) {
        try {
          const refreshed = await callRefreshEndpoint(base);
          next = tokensFromResponse(refreshed);
        } catch (error) {
          console.warn('Web token refresh failed, reissuing.', error);
          const issued = await callWebTokenEndpoint(deviceId);
          next = tokensFromResponse(issued);
        }
      } else {
        const issued = await callWebTokenEndpoint(deviceId);
        next = tokensFromResponse(issued);
      }
      saveToStorage(next);
      return next;
    } catch (error) {
      console.error('Failed to acquire web tokens', error);
      saveToStorage(null);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export async function getValidAccessToken(force?: boolean): Promise<string | null> {
  if (!isBrowser()) return null;
  const tokens = await fetchFreshTokens(Boolean(force));
  if (!tokens) return null;
  if (isAccessExpired(tokens)) {
    const refreshed = await fetchFreshTokens(true);
    return refreshed?.accessToken ?? null;
  }
  return tokens.accessToken;
}

export function invalidateStoredTokens() {
  saveToStorage(null);
}

export function getWebDeviceId(): string {
  return ensureDeviceId();
}

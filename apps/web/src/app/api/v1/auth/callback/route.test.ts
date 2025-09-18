import { afterEach, describe, expect, it, vi } from 'vitest';

const exchangeAuthorizationCode = vi.fn();
const resolveUserIdByEmail = vi.fn();
const revokeTokensForDevice = vi.fn();
const issueTokens = vi.fn();

vi.mock('@/lib/auth/oidc', () => ({
  exchangeAuthorizationCode,
}));
vi.mock('@/lib/auth/user', () => ({
  resolveUserIdByEmail,
}));
vi.mock('@/lib/auth/refresh-repo', () => ({
  revokeTokensForDevice,
}));
vi.mock('@/lib/auth/token-service', () => ({
  issueTokens,
}));

vi.stubEnv('BFF_APP_JWT_SECRET', 'test-secret');
vi.stubEnv('BFF_AUTH_DEV_MODE', '1');

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe('GET /api/v1/auth/callback', () => {
  it('returns tokens when code exchange succeeds', async () => {
    exchangeAuthorizationCode.mockResolvedValue({
      email: 'user@example.com',
      name: 'User',
      sub: 'user@example.com',
    });
    resolveUserIdByEmail.mockResolvedValue('user-id');
    revokeTokensForDevice.mockResolvedValue(undefined);
    issueTokens.mockResolvedValue({
      accessToken: 'access-token',
      accessTokenExpiresAt: new Date(Date.now() + 15_000),
      refreshToken: 'refresh-token',
      refreshTokenExpiresAt: new Date(Date.now() + 60_000),
    });

    const { GET } = await import('./route');
    const response = await GET(
      new Request('http://localhost:3000/api/v1/auth/callback?code=dev%3Auser@example.com&deviceId=device-1')
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.accessToken).toBe('access-token');
    expect(json.refreshToken).toBe('refresh-token');
    expect(json.deviceId).toBe('device-1');
    expect(json.accessTokenExpiresIn).toBeGreaterThan(0);
    expect(json.accessTokenExpiresIn).toBeLessThanOrEqual(15);
    expect(json.refreshTokenExpiresAt).toBeDefined();
    expect(exchangeAuthorizationCode).toHaveBeenCalled();
    expect(resolveUserIdByEmail).toHaveBeenCalledWith('user@example.com', 'User');
  });

  it('returns 400 when deviceId is missing', async () => {
    const { GET } = await import('./route');
    const response = await GET(new Request('http://localhost:3000/api/v1/auth/callback?code=dev:foo')); // deviceId missing
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.code).toBe('invalid_request');
  });
});

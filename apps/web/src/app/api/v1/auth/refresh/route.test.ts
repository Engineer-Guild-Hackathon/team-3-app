import { afterEach, describe, expect, it, vi } from 'vitest';
import { hashRefreshToken } from '@team3/auth-shared';

const findRefreshToken = vi.fn();
const issueTokens = vi.fn();

vi.mock('@/lib/auth/refresh-repo', () => ({
  findRefreshToken,
}));
vi.mock('@/lib/auth/token-service', () => ({
  issueTokens,
}));

vi.stubEnv('BFF_APP_JWT_SECRET', 'test-secret');

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe('POST /api/v1/auth/refresh', () => {
  it('rotates refresh token successfully', async () => {
    const refreshToken = 'refresh-token-value';
    const hash = hashRefreshToken(refreshToken);
    findRefreshToken.mockResolvedValue({
      id: 'token-id',
      userId: 'user-id',
      deviceId: 'dev-simulator',
      tokenHash: hash,
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      metadata: { scopes: ['profile:read'] },
    });
    issueTokens.mockResolvedValue({
      accessToken: 'new-access',
      accessTokenExpiresAt: new Date(Date.now() + 10_000),
      refreshToken: 'new-refresh',
      refreshTokenExpiresAt: new Date(Date.now() + 100_000),
    });

    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost:3000/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken, deviceId: 'dev-simulator' }),
      })
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.accessToken).toBe('new-access');
    expect(json.refreshToken).toBe('new-refresh');
    expect(json.deviceId).toBe('dev-simulator');
    expect(json.accessTokenExpiresIn).toBeGreaterThan(0);
    expect(json.accessTokenExpiresIn).toBeLessThanOrEqual(10);
  });

  it('rejects invalid payload', async () => {
    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost:3000/api/v1/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: 'dev-simulator' }),
      })
    );
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.code).toBe('invalid_request');
  });
});

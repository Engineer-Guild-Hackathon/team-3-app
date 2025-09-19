import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const getServerSession = vi.fn();

vi.mock('next-auth', () => ({
  getServerSession,
}));

vi.mock('@/auth', () => ({
  authOptions: {},
}));

const resolveUserIdByEmail = vi.fn();
vi.mock('@/lib/auth/user', () => ({
  resolveUserIdByEmail,
}));

const issueTokens = vi.fn();
vi.mock('@/lib/auth/token-service', () => ({
  issueTokens,
}));

const revokeTokensForDevice = vi.fn();
vi.mock('@/lib/auth/refresh-repo', () => ({
  revokeTokensForDevice,
}));

vi.mock('../../_lib/cors', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as Record<string, unknown>),
    createCorsContext: vi.fn(() => ({ origin: null, isAllowed: true, hasOriginHeader: false })),
    rejectIfDisallowed: vi.fn(() => null),
  };
});

vi.mock('@/lib/logger', () => ({
  getLogger: () => ({ info: vi.fn(), error: vi.fn() }),
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe('POST /api/v1/auth/web-token', () => {
  it('issues tokens for authenticated session', async () => {
    getServerSession.mockResolvedValue({ user: { email: 'user@example.com' } });
    resolveUserIdByEmail.mockResolvedValue('user-1');
    const now = Date.now();
    issueTokens.mockResolvedValue({
      accessToken: 'access',
      accessTokenExpiresAt: new Date(now + 60000),
      refreshToken: 'refresh',
      refreshTokenExpiresAt: new Date(now + 3600000),
    });

    const { POST } = await import('./route');
    const response = await POST(new NextRequest('http://localhost/api/v1/auth/web-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: 'web-client-1' }),
    }));

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.accessToken).toBe('access');
    expect(json.refreshToken).toBe('refresh');
    expect(json.deviceId).toBe('web-client-1');
    expect(issueTokens).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1', deviceId: 'web-client-1' }));
    expect(revokeTokensForDevice).toHaveBeenCalledWith('user-1', 'web-client-1');
  });

  it('returns 401 when session missing', async () => {
    getServerSession.mockResolvedValue(null);
    const { POST } = await import('./route');
    const response = await POST(new NextRequest('http://localhost/api/v1/auth/web-token', { method: 'POST' }));
    expect(response.status).toBe(401);
  });

  it('returns 400 when deviceId missing', async () => {
    getServerSession.mockResolvedValue({ user: { email: 'user@example.com' } });
    const { POST } = await import('./route');
    const response = await POST(new NextRequest('http://localhost/api/v1/auth/web-token', { method: 'POST' }));
    expect(response.status).toBe(400);
  });
});

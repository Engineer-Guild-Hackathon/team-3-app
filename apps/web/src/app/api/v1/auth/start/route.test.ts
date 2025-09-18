import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/config', () => ({
  getOidcConfig: () => ({
    authorizationEndpoint: 'https://example.com/auth',
    tokenEndpoint: 'https://example.com/token',
    clientId: 'client-id',
    clientSecret: 'secret',
    redirectUri: 'spar://auth/callback',
    scope: 'openid profile email',
    devMode: false,
  }),
}));

describe('GET /api/v1/auth/start', () => {
  it('returns OIDC metadata', async () => {
    const { GET } = await import('./route');
    const response = await GET(new Request('http://localhost:3000/api/v1/auth/start'));
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toMatchObject({
      authorizationEndpoint: 'https://example.com/auth',
      clientId: 'client-id',
      redirectUri: 'spar://auth/callback',
      scope: 'openid profile email',
      codeChallengeMethod: 'S256',
    });
  });
});

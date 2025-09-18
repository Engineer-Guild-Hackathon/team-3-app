import { afterEach, describe, expect, it, vi } from 'vitest';

type AuthorizeOk = {
  type: 'ok';
  user: {
    userId: string;
    scopes: string[];
    source: 'bearer' | 'cookie';
    tokenType: 'access' | 'refresh' | 'unknown';
    deviceId?: string;
  };
};

type AuthorizeError = {
  type: 'error';
  response: Response;
};

type AuthorizeResult = AuthorizeOk | AuthorizeError;

const authorize = vi.fn<(request: Request, cors: unknown, options?: unknown) => Promise<AuthorizeResult>>();

vi.mock('../_lib/auth', () => ({
  authorize,
}));

afterEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe('GET /api/v1/me', () => {
  it('returns user summary when authorization succeeds', async () => {
    authorize.mockResolvedValue({
      type: 'ok',
      user: {
        userId: 'user-123',
        scopes: ['profile:read', 'chat:rw'],
        source: 'bearer',
        tokenType: 'access',
        deviceId: 'device-9',
      },
    });

    const { GET } = await import('./route');
    const response = await GET(
      new Request('http://localhost:3000/api/v1/me', {
        headers: {
          Authorization: 'Bearer token',
          Origin: 'https://mobile.example.com',
        },
      })
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({
      id: 'user-123',
      scopes: ['profile:read', 'chat:rw'],
      authSource: 'bearer',
      tokenType: 'access',
      deviceId: 'device-9',
    });
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://mobile.example.com');
  });

  it('returns authorize error response as-is when authorization fails', async () => {
    const errorResponse = new Response(JSON.stringify({ code: 'missing_token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
    authorize.mockResolvedValue({ type: 'error', response: errorResponse });

    const { GET } = await import('./route');
    const response = await GET(new Request('http://localhost:3000/api/v1/me'));

    expect(response).toBe(errorResponse);
  });
});

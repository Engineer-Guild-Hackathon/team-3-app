import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

type RouteModule = typeof import('./route');
type GetRouteHandler = RouteModule['GET'];
type RouteContext = Parameters<GetRouteHandler>[1];

const authorize = vi.fn();
const dbRef: { current: any } = { current: undefined };

vi.mock('../../../_lib/auth', () => ({
  authorize,
}));

vi.mock('@/db/client', () => ({
  get db() {
    return dbRef.current;
  },
}));

const mockLogger = { info: vi.fn(), error: vi.fn() };
vi.mock('@/lib/logger', () => ({
  getLogger: () => mockLogger,
}));

afterEach(() => {
  vi.clearAllMocks();
  dbRef.current = undefined;
});

describe('GET /api/v1/chats/:id/messages', () => {
  it('returns messages when chat exists', async () => {
    authorize.mockResolvedValue({
      type: 'ok',
      user: {
        userId: 'user-1',
        scopes: ['chat:rw'],
        source: 'bearer',
        tokenType: 'access',
      },
    });

    const recordedLimit: { value?: number } = {};
    dbRef.current = createDbMock({
      ownedChat: true,
      messages: [
        { id: 'm1', role: 'user', content: 'hello', createdAt: new Date('2025-01-01T00:00:00Z') },
        { id: 'm2', role: 'assistant', content: 'hi', createdAt: new Date('2025-01-01T00:01:00Z') },
      ],
      recordedLimit,
    });

    const { GET } = await import('./route');
    const response = await GET(
      createNextRequest('http://localhost:3000/api/v1/chats/chat-1/messages'),
      createRouteContext('chat-1')
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.items).toHaveLength(2);
    expect(json.items[0].createdAt).toBe('2025-01-01T00:00:00.000Z');
    expect(recordedLimit.value).toBe(100);
  });

  it('returns 404 when chat is not found', async () => {
    authorize.mockResolvedValue({
      type: 'ok',
      user: {
        userId: 'user-1',
        scopes: ['chat:rw'],
        source: 'bearer',
        tokenType: 'access',
      },
    });

    dbRef.current = createDbMock({ ownedChat: false });

    const { GET } = await import('./route');
    const response = await GET(
      createNextRequest('http://localhost:3000/api/v1/chats/chat-x/messages'),
      createRouteContext('chat-x')
    );

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.code).toBe('not_found');
  });

  it('returns 503 when database is unavailable', async () => {
    authorize.mockResolvedValue({
      type: 'ok',
      user: {
        userId: 'user-1',
        scopes: ['chat:rw'],
        source: 'bearer',
        tokenType: 'access',
      },
    });

    const { GET } = await import('./route');
    const response = await GET(
      createNextRequest('http://localhost:3000/api/v1/chats/chat-1/messages'),
      createRouteContext('chat-1')
    );

    expect(response.status).toBe(503);
  });

  it('clamps limit when query exceeds maximum', async () => {
    authorize.mockResolvedValue({
      type: 'ok',
      user: {
        userId: 'user-1',
        scopes: ['chat:rw'],
        source: 'bearer',
        tokenType: 'access',
      },
    });

    const recordedLimit: { value?: number } = {};
    dbRef.current = createDbMock({
      ownedChat: true,
      messages: [],
      recordedLimit,
    });

    const { GET } = await import('./route');
    const response = await GET(
      createNextRequest('http://localhost:3000/api/v1/chats/chat-1/messages?limit=2000'),
      createRouteContext('chat-1')
    );

    expect(response.status).toBe(200);
    expect(recordedLimit.value).toBe(1000);
  });

  it('converts string timestamps to ISO format', async () => {
    authorize.mockResolvedValue({
      type: 'ok',
      user: {
        userId: 'user-1',
        scopes: ['chat:rw'],
        source: 'bearer',
        tokenType: 'access',
      },
    });

    dbRef.current = createDbMock({
      ownedChat: true,
      messages: [
        { id: 'm1', role: 'user', content: 'hello', createdAt: '2025-01-01T00:00:00Z' },
      ],
    });

    const { GET } = await import('./route');
    const response = await GET(
      createNextRequest('http://localhost:3000/api/v1/chats/chat-1/messages'),
      createRouteContext('chat-1')
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.items[0].createdAt).toBe('2025-01-01T00:00:00.000Z');
  });

  it('returns 500 when database query throws', async () => {
    authorize.mockResolvedValue({
      type: 'ok',
      user: {
        userId: 'user-1',
        scopes: ['chat:rw'],
        source: 'bearer',
        tokenType: 'access',
      },
    });

    dbRef.current = createDbMock({ ownedChat: true, throwOnMessages: true });

    const { GET } = await import('./route');
    const response = await GET(
      createNextRequest('http://localhost:3000/api/v1/chats/chat-1/messages'),
      createRouteContext('chat-1')
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.code).toBe('internal_error');
  });

  it('propagates authorization failure', async () => {
    const errorResponse = new Response('unauthorized', { status: 401 });
    authorize.mockResolvedValue({ type: 'error', response: errorResponse });

    const { GET } = await import('./route');
    const response = await GET(
      createNextRequest('http://localhost:3000/api/v1/chats/chat-1/messages'),
      createRouteContext('chat-1')
    );

    expect(response).toBe(errorResponse);
  });
});

function createNextRequest(url: string) {
  return new NextRequest(url);
}

function createRouteContext(id: string): RouteContext {
  return {
    params: Promise.resolve({ id }),
  };
}

function createDbMock(options: {
  ownedChat?: boolean;
  messages?: Array<{ id: string; role: string; content: string; createdAt: unknown }>;
  recordedLimit?: { value?: number };
  throwOnMessages?: boolean;
}) {
  let selectCall = 0;
  const select = vi.fn(() => {
    const current = selectCall++;
    const chain: any = {};
    chain.from = vi.fn(() => chain);
    chain.where = vi.fn(() => chain);
    chain.orderBy = vi.fn(() => chain);
    chain.limit = vi.fn(async (limitArg?: number) => {
      if (current === 0) {
        return options.ownedChat === false ? [] : [{ id: 'chat-1' }];
      }
      if (typeof limitArg === 'number' && options.recordedLimit) {
        options.recordedLimit.value = limitArg;
      }
      if (options.throwOnMessages) {
        throw new Error('db error');
      }
      return options.messages ?? [];
    });
    return chain;
  });
  return { select };
}

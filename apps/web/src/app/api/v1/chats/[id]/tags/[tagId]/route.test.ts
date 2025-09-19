import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const authorize = vi.fn();
const dbRef: { current: any } = { current: undefined };

vi.mock('../../../../_lib/auth', () => ({
  authorize,
}));

vi.mock('@/db/client', () => ({
  get db() {
    return dbRef.current;
  },
}));

vi.mock('@/db/schema', () => ({
  chatTags: {
    chatId: 'chat_tags.chat_id',
    tagId: 'chat_tags.tag_id',
  },
}));

vi.mock('drizzle-orm', () => ({
  and: vi.fn((...args: unknown[]) => ({ and: args })),
  eq: vi.fn((...args: unknown[]) => ({ eq: args })),
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  dbRef.current = undefined;
});

describe('DELETE /api/v1/chats/:id/tags/:tagId', () => {
  it('removes tag when authorized and db available', async () => {
    authorize.mockResolvedValue({ type: 'ok', user: { userId: 'user-1' } });
    const where = vi.fn(() => Promise.resolve());
    const del = vi.fn(() => ({ where }));
    dbRef.current = { delete: del };

    const { DELETE } = await import('./route');
    const response = await DELETE(buildRequest('http://localhost:3000'), {
      params: Promise.resolve({ id: 'chat-1', tagId: 'tag-1' }),
    });

    expect(response.status).toBe(204);
    expect(del).toHaveBeenCalledTimes(1);
    expect(authorize).toHaveBeenCalled();
  });

  it('returns error response from authorize', async () => {
    const errorResponse = new Response('unauthorized', { status: 401 });
    authorize.mockResolvedValue({ type: 'error', response: errorResponse });

    const { DELETE } = await import('./route');
    const response = await DELETE(buildRequest('http://localhost:3000'), {
      params: Promise.resolve({ id: 'chat-1', tagId: 'tag-1' }),
    });

    expect(response).toBe(errorResponse);
  });

  it('returns 400 when params missing', async () => {
    authorize.mockResolvedValue({ type: 'ok', user: { userId: 'user-1' } });
    dbRef.current = { delete: vi.fn() };

    const { DELETE } = await import('./route');
    const response = await DELETE(buildRequest('http://localhost:3000'), {
      params: Promise.resolve({ id: '', tagId: '' }),
    });

    expect(response.status).toBe(400);
  });

  it('returns 503 when db unavailable', async () => {
    authorize.mockResolvedValue({ type: 'ok', user: { userId: 'user-1' } });
    dbRef.current = undefined;

    const { DELETE } = await import('./route');
    const response = await DELETE(buildRequest('http://localhost:3000'), {
      params: Promise.resolve({ id: 'chat-1', tagId: 'tag-1' }),
    });
  
    expect(response.status).toBe(503);
  });
});

function buildRequest(url: string, init?: RequestInit) {
  return new NextRequest(new Request(url, init));
}

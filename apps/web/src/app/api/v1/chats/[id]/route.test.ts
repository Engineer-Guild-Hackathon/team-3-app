import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const authorize = vi.fn();
const dbRef: { current: any } = { current: undefined };

vi.mock('../../_lib/auth', () => ({
  authorize,
}));

vi.mock('@/db/client', () => ({
  get db() {
    return dbRef.current;
  },
}));

vi.mock('@/db/schema', () => ({
  chats: {
    id: 'chats.id',
    userId: 'chats.user_id',
    title: 'chats.title',
    status: 'chats.status',
    updatedAt: 'chats.updated_at',
    deletedAt: 'chats.deleted_at',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: unknown[]) => ({ eq: args })),
  and: vi.fn((...args: unknown[]) => ({ and: args })),
  isNull: vi.fn((...args: unknown[]) => ({ isNull: args })),
  sql: (...args: unknown[]) => ({ sql: args }),
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  dbRef.current = undefined;
});

function createUpdateMock(rows: unknown[]) {
  const returning = vi.fn(() => Promise.resolve(rows));
  const where = vi.fn(() => ({ returning }));
  const set = vi.fn(() => ({ where }));
  const update = vi.fn(() => ({ set }));
  return { update, set, where, returning };
}

function buildRequest(url: string, init?: RequestInit) {
  return new NextRequest(new Request(url, init));
}

describe('PATCH /api/v1/chats/:id', () => {
  it('updates chat title and returns 204', async () => {
    authorize.mockResolvedValue({
      type: 'ok',
      user: {
        userId: 'user-123',
        scopes: ['chat:rw'],
        source: 'bearer',
        tokenType: 'access',
      },
    });
    const { update, set, where, returning } = createUpdateMock([{ id: 'chat-1' }]);
    dbRef.current = { update };

    const { PATCH } = await import('./route');
    const response = await PATCH(
      buildRequest('http://localhost:3000/api/v1/chats/chat-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Renamed chat' }),
      }),
      { params: { id: 'chat-1' } }
    );

    expect(response.status).toBe(204);
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ title: 'Renamed chat' }));
    expect(where).toHaveBeenCalledTimes(1);
    expect(returning).toHaveBeenCalledTimes(1);
  });

  it('propagates authorize error response', async () => {
    const errorResponse = new Response('unauthorized', { status: 401 });
    authorize.mockResolvedValue({ type: 'error', response: errorResponse });

    const { PATCH } = await import('./route');
    const response = await PATCH(
      buildRequest('http://localhost:3000/api/v1/chats/chat-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Renamed chat' }),
      }),
      { params: { id: 'chat-1' } }
    );

    expect(response).toBe(errorResponse);
  });

  it('returns 400 when payload is invalid', async () => {
    authorize.mockResolvedValue({
      type: 'ok',
      user: {
        userId: 'user-123',
        scopes: ['chat:rw'],
        source: 'bearer',
        tokenType: 'access',
      },
    });
    dbRef.current = { update: vi.fn() };

    const { PATCH } = await import('./route');
    const response = await PATCH(
      buildRequest('http://localhost:3000/api/v1/chats/chat-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
      { params: { id: 'chat-1' } }
    );

    expect(response.status).toBe(400);
  });

  it('returns 404 when chat not found', async () => {
    authorize.mockResolvedValue({
      type: 'ok',
      user: {
        userId: 'user-123',
        scopes: ['chat:rw'],
        source: 'bearer',
        tokenType: 'access',
      },
    });
    const { update } = createUpdateMock([]);
    dbRef.current = { update };

    const { PATCH } = await import('./route');
    const response = await PATCH(
      buildRequest('http://localhost:3000/api/v1/chats/chat-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Renamed chat' }),
      }),
      { params: { id: 'chat-1' } }
    );

    expect(response.status).toBe(404);
  });
});

describe('DELETE /api/v1/chats/:id', () => {
  it('marks chat as deleted instead of removing it', async () => {
    authorize.mockResolvedValue({
      type: 'ok',
      user: {
        userId: 'user-123',
        scopes: ['chat:rw'],
        source: 'bearer',
        tokenType: 'access',
      },
    });
    const { update, set, returning } = createUpdateMock([{ id: 'chat-1' }]);
    dbRef.current = { update };

    const { DELETE } = await import('./route');
    const response = await DELETE(
      buildRequest('http://localhost:3000/api/v1/chats/chat-1', { method: 'DELETE' }),
      { params: { id: 'chat-1' } }
    );

    expect(response.status).toBe(204);
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ deletedAt: expect.anything() }));
    expect(returning).toHaveBeenCalledTimes(1);
  });

  it('returns 503 when database is unavailable', async () => {
    authorize.mockResolvedValue({
      type: 'ok',
      user: {
        userId: 'user-123',
        scopes: ['chat:rw'],
        source: 'bearer',
        tokenType: 'access',
      },
    });
    dbRef.current = undefined;

    const { DELETE } = await import('./route');
    const response = await DELETE(
      buildRequest('http://localhost:3000/api/v1/chats/chat-1', { method: 'DELETE' }),
      { params: { id: 'chat-1' } }
    );

    expect(response.status).toBe(503);
  });

  it('returns 404 when delete target is missing', async () => {
    authorize.mockResolvedValue({
      type: 'ok',
      user: {
        userId: 'user-123',
        scopes: ['chat:rw'],
        source: 'bearer',
        tokenType: 'access',
      },
    });
    const { update } = createUpdateMock([]);
    dbRef.current = { update };

    const { DELETE } = await import('./route');
    const response = await DELETE(
      buildRequest('http://localhost:3000/api/v1/chats/chat-1', { method: 'DELETE' }),
      { params: { id: 'chat-1' } }
    );

    expect(response.status).toBe(404);
  });
});

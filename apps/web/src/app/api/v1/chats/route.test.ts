import { afterEach, describe, expect, it, vi } from 'vitest';

const authorize = vi.fn();
const dbRef: { current: any } = { current: undefined };

vi.mock('../_lib/auth', () => ({
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
    subjectId: 'chats.subject_id',
    topicId: 'chats.topic_id',
    updatedAt: 'chats.updated_at',
    createdAt: 'chats.created_at',
    deletedAt: 'chats.deleted_at',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: unknown[]) => ({ eq: args })),
  desc: vi.fn((...args: unknown[]) => ({ desc: args })),
  and: vi.fn((...args: unknown[]) => ({ and: args })),
  isNull: vi.fn((...args: unknown[]) => ({ isNull: args })),
}));

function createSelectMock(rows: unknown[]) {
  const chain: any = {
    from: vi.fn(() => chain),
    leftJoin: vi.fn(() => chain),
    innerJoin: vi.fn(() => chain),
    where: vi.fn(() => chain),
    orderBy: vi.fn(() => chain),
    limit: vi.fn(async (...args: unknown[]) => {
      chain._limitArgs = args;
      return rows;
    }),
    offset: vi.fn(() => chain),
    _limitArgs: undefined,
  };
  const select = vi.fn(() => chain);
  return { select, chain };
}

function createInsertMock(returnRow: unknown) {
  const returning = vi.fn(() => Promise.resolve([returnRow]));
  const values = vi.fn(() => ({ returning }));
  const insert = vi.fn(() => ({ values }));
  return { insert, values, returning };
}

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  dbRef.current = undefined;
});

describe('GET /api/v1/chats', () => {
  it('returns chat list for authorized user', async () => {
    authorize.mockResolvedValue({
      type: 'ok',
      user: {
        userId: 'user-123',
        scopes: ['chat:rw'],
        source: 'bearer',
        tokenType: 'access',
      },
    });
    const rows = [
      {
        id: 'chat-1',
        title: 'First chat',
        status: 'in_progress',
        subjectId: 'subject-1',
        topicId: null,
        updatedAt: '2025-01-01T00:00:00.000Z',
        createdAt: '2024-12-31T00:00:00.000Z',
        lastMessagePreview: 'latest message',
        unreadCount: 0,
        metadata: null,
      },
    ];
    const { select, chain } = createSelectMock(rows);
    dbRef.current = {
      select,
    };

    const { GET } = await import('./route');
    const response = await GET(new Request('http://localhost:3000/api/v1/chats?limit=10'));

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({
      items: rows,
      nextCursor: null,
    });
    expect(authorize).toHaveBeenCalledWith(expect.anything(), expect.anything(), expect.objectContaining({ requiredScope: 'chat:rw' }));
    expect(select).toHaveBeenCalledTimes(1);
    expect(chain.limit).toHaveBeenCalledWith(10);
  });

  it('propagates authorization error response', async () => {
    const errorResponse = new Response('unauthorized', { status: 401 });
    authorize.mockResolvedValue({ type: 'error', response: errorResponse });

    const { GET } = await import('./route');
    const response = await GET(new Request('http://localhost:3000/api/v1/chats'));

    expect(response).toBe(errorResponse);
  });

  it('caps limit to 200 when query exceeds maximum', async () => {
    authorize.mockResolvedValue({
      type: 'ok',
      user: {
        userId: 'user-123',
        scopes: ['chat:rw'],
        source: 'bearer',
        tokenType: 'access',
      },
    });
    const { select, chain } = createSelectMock([]);
    dbRef.current = { select };

    const { GET } = await import('./route');
    await GET(new Request('http://localhost:3000/api/v1/chats?limit=999'));

    expect(chain._limitArgs?.[0]).toBe(200);
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

    const { GET } = await import('./route');
    const response = await GET(new Request('http://localhost:3000/api/v1/chats'));

    expect(response.status).toBe(503);
  });
});

describe('POST /api/v1/chats', () => {
  it('creates a chat and returns 201 with payload', async () => {
    authorize.mockResolvedValue({
      type: 'ok',
      user: {
        userId: 'user-123',
        scopes: ['chat:rw'],
        source: 'bearer',
        tokenType: 'access',
      },
    });
    const created = {
      id: 'chat-1',
      title: 'New chat',
      status: 'in_progress',
      subjectId: null,
      topicId: null,
      updatedAt: '2025-01-01T00:00:00.000Z',
      createdAt: '2025-01-01T00:00:00.000Z',
    };
    const { insert, values, returning } = createInsertMock(created);
    dbRef.current = { insert };

    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost:3000/api/v1/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New chat' }),
      })
    );

    expect(response.status).toBe(201);
    const json = await response.json();
    expect(json).toEqual(created);
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-123', title: 'New chat' }));
    expect(returning).toHaveBeenCalledTimes(1);
  });

  it('uses default title when none provided', async () => {
    authorize.mockResolvedValue({
      type: 'ok',
      user: {
        userId: 'user-123',
        scopes: ['chat:rw'],
        source: 'bearer',
        tokenType: 'access',
      },
    });
    const created = {
      id: 'chat-1',
      title: '新しいチャット',
      status: 'in_progress',
      subjectId: null,
      topicId: null,
      updatedAt: '2025-01-01T00:00:00.000Z',
      createdAt: '2025-01-01T00:00:00.000Z',
    };
    const { insert, values } = createInsertMock(created);
    dbRef.current = { insert };

    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost:3000/api/v1/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
    );

    expect(response.status).toBe(201);
    const payload = await response.json();
    expect(payload.title).toBe('新しいチャット');
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ title: '新しいチャット' }));
  });

  it('returns 400 when request body is invalid json', async () => {
    authorize.mockResolvedValue({
      type: 'ok',
      user: {
        userId: 'user-123',
        scopes: ['chat:rw'],
        source: 'bearer',
        tokenType: 'access',
      },
    });
    dbRef.current = { insert: vi.fn() };

    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost:3000/api/v1/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-json',
      })
    );

    expect(response.status).toBe(400);
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

    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost:3000/api/v1/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'x' }),
      })
    );

    expect(response.status).toBe(503);
  });
});

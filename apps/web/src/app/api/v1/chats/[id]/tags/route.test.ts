import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

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

vi.mock('@/db/schema', () => ({
  chatTags: {
    chatId: 'chat_tags.chat_id',
    tagId: 'chat_tags.tag_id',
    assignedBy: 'chat_tags.assigned_by',
    confidence: 'chat_tags.confidence',
    createdAt: 'chat_tags.created_at',
  },
  tags: {
    id: 'tags.id',
    name: 'tags.name',
    tagTypeId: 'tags.tag_type_id',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: unknown[]) => ({ eq: args })),
  and: vi.fn((...args: unknown[]) => ({ and: args })),
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  dbRef.current = undefined;
});

describe('GET /api/v1/chats/:id/tags', () => {
  it('returns chat tags', async () => {
    authorize.mockResolvedValue({ type: 'ok', user: { userId: 'user-1' } });
    const rows = [
      {
        tagId: 'tag-1',
        assignedBy: 'ai',
        confidence: 0.8,
        createdAt: '2025-01-01T00:00:00.000Z',
        name: 'ベイズの定理',
        tagTypeId: 1,
      },
    ];
    const builder: any = {
      leftJoin: vi.fn(() => builder),
      where: vi.fn(() => Promise.resolve(rows)),
    };
    const from = vi.fn(() => builder);
    const select = vi.fn(() => ({ from }));
    dbRef.current = { select };

    const { GET } = await import('./route');
    const response = await GET(buildRequest('http://localhost:3000'), {
      params: Promise.resolve({ id: 'chat-1' }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ items: rows });
  });

  it('returns 503 when db unavailable', async () => {
    authorize.mockResolvedValue({ type: 'ok', user: { userId: 'user-1' } });
    dbRef.current = undefined;

    const { GET } = await import('./route');
    const response = await GET(buildRequest('http://localhost:3000'), {
      params: Promise.resolve({ id: 'chat-1' }),
    });

    expect(response.status).toBe(503);
  });
});

describe('POST /api/v1/chats/:id/tags', () => {
  it('upserts tag assignment', async () => {
    authorize.mockResolvedValue({ type: 'ok', user: { userId: 'user-1' } });
    const onConflictDoUpdate = vi.fn(() => Promise.resolve());
    const values = vi.fn(() => ({ onConflictDoUpdate }));
    const insert = vi.fn(() => ({ values }));
    dbRef.current = { insert };

    const { POST } = await import('./route');
    const response = await POST(
      buildRequest('http://localhost:3000', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId: 'tag-1', assignedBy: 'user', confidence: 0.9 }),
      }),
      { params: Promise.resolve({ id: 'chat-1' }) }
    );

    expect(response.status).toBe(204);
    expect(values).toHaveBeenCalled();
    expect(onConflictDoUpdate).toHaveBeenCalled();
  });

  it('returns 400 when payload invalid', async () => {
    authorize.mockResolvedValue({ type: 'ok', user: { userId: 'user-1' } });
    dbRef.current = { insert: vi.fn() };

    const { POST } = await import('./route');
    const response = await POST(buildRequest('http://localhost:3000', { method: 'POST' }), {
      params: Promise.resolve({ id: 'chat-1' }),
    });
  
    expect(response.status).toBe(400);
  });
});

function buildRequest(url: string, init?: RequestInit) {
  return new NextRequest(new Request(url, init));
}

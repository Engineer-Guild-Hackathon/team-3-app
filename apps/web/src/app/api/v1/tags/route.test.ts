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
  tags: {
    id: 'tags.id',
    name: 'tags.name',
    description: 'tags.description',
    subjectId: 'tags.subject_id',
    topicId: 'tags.topic_id',
    tagTypeId: 'tags.tag_type_id',
  },
}));

vi.mock('drizzle-orm', () => ({
  asc: vi.fn((value: unknown) => ({ asc: value })),
  eq: vi.fn((...args: unknown[]) => ({ eq: args })),
  and: vi.fn((...args: unknown[]) => ({ and: args })),
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  dbRef.current = undefined;
});

describe('GET /api/v1/tags', () => {
  it('returns tags for authorized user', async () => {
    authorize.mockResolvedValue({ type: 'ok', user: { userId: 'user-1' } });
    const rows = [
      {
        id: 'tag-1',
        name: 'ベイズの定理',
        description: '条件付き確率に基づく定理',
        subjectId: 'subject-1',
        topicId: null,
        tagTypeId: 1,
      },
    ];
    const builder: any = {
      where: vi.fn(() => builder),
      orderBy: vi.fn(() => Promise.resolve(rows)),
    };
    const from = vi.fn(() => builder);
    const select = vi.fn(() => ({ from }));
    dbRef.current = { select };

    const { GET } = await import('./route');
    const response = await GET(new Request('http://localhost:3000/api/v1/tags?subjectId=subject-1'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ items: rows });
    expect(select).toHaveBeenCalledWith({
      id: 'tags.id',
      name: 'tags.name',
      description: 'tags.description',
      subjectId: 'tags.subject_id',
      topicId: 'tags.topic_id',
      tagTypeId: 'tags.tag_type_id',
    });
  });

  it('returns 400 when topicId is provided without subjectId', async () => {
    authorize.mockResolvedValue({ type: 'ok', user: { userId: 'user-1' } });
    dbRef.current = { select: vi.fn() };

    const { GET } = await import('./route');
    const response = await GET(new Request('http://localhost:3000/api/v1/tags?topicId=topic-1'));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe('invalid_request');
  });

  it('returns authorization response when authorize fails', async () => {
    const errorResponse = new Response('forbidden', { status: 403 });
    authorize.mockResolvedValue({ type: 'error', response: errorResponse });

    const { GET } = await import('./route');
    const response = await GET(new Request('http://localhost:3000/api/v1/tags'));

    expect(response).toBe(errorResponse);
  });

  it('returns 503 when database is unavailable', async () => {
    authorize.mockResolvedValue({ type: 'ok', user: { userId: 'user-1' } });
    dbRef.current = undefined;

    const { GET } = await import('./route');
    const response = await GET(new Request('http://localhost:3000/api/v1/tags'));

    expect(response.status).toBe(503);
  });
});

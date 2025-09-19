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
  userTagMastery: {
    userId: 'user_tag_mastery.user_id',
    tagId: 'user_tag_mastery.tag_id',
    masteryScore: 'user_tag_mastery.mastery_score',
    lastAssessedAt: 'user_tag_mastery.last_assessed_at',
  },
}));

vi.mock('drizzle-orm', () => ({
  asc: vi.fn((value: unknown) => ({ asc: value })),
  eq: vi.fn((...args: unknown[]) => ({ eq: args })),
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  dbRef.current = undefined;
});

describe('GET /api/v1/tag-mastery', () => {
  it('returns mastery list for authorized user', async () => {
    authorize.mockResolvedValue({ type: 'ok', user: { userId: 'user-1' } });
    const rows = [
      { tagId: 'tag-1', masteryScore: 0.4, lastAssessedAt: '2025-01-01T00:00:00Z' },
    ];
    const builder: any = {
      where: vi.fn(() => builder),
      orderBy: vi.fn(() => Promise.resolve(rows)),
    };
    const from = vi.fn(() => builder);
    const select = vi.fn(() => ({ from }));
    dbRef.current = { select };

    const { GET } = await import('./route');
    const response = await GET(new Request('http://localhost:3000/api/v1/tag-mastery'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ items: rows });
  });

  it('returns authorization error when authorize fails', async () => {
    const errorResponse = new Response('unauthorized', { status: 401 });
    authorize.mockResolvedValue({ type: 'error', response: errorResponse });

    const { GET } = await import('./route');
    const response = await GET(new Request('http://localhost:3000/api/v1/tag-mastery'));

    expect(response).toBe(errorResponse);
  });

  it('returns 503 when database unavailable', async () => {
    authorize.mockResolvedValue({ type: 'ok', user: { userId: 'user-1' } });
    dbRef.current = undefined;

    const { GET } = await import('./route');
    const response = await GET(new Request('http://localhost:3000/api/v1/tag-mastery'));

    expect(response.status).toBe(503);
  });
});

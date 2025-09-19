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
  tagTypes: {
    id: 'tag_types.id',
    code: 'tag_types.code',
    label: 'tag_types.label',
  },
}));

vi.mock('drizzle-orm', () => ({
  asc: vi.fn((value: unknown) => ({ asc: value })),
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  dbRef.current = undefined;
});

describe('GET /api/v1/tag-types', () => {
  it('returns tag types for authorized user', async () => {
    authorize.mockResolvedValue({
      type: 'ok',
      user: { userId: 'user-1' },
    });
    const rows = [
      { id: 1, code: 'definition', label: '定義' },
      { id: 2, code: 'procedure', label: '手順' },
    ];
    const orderBy = vi.fn(() => Promise.resolve(rows));
    const from = vi.fn(() => ({ orderBy }));
    const select = vi.fn(() => ({ from }));
    dbRef.current = { select };

    const { GET } = await import('./route');
    const response = await GET(new Request('http://localhost:3000/api/v1/tag-types'));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ items: rows });
    expect(select).toHaveBeenCalledWith({
      id: 'tag_types.id',
      code: 'tag_types.code',
      label: 'tag_types.label',
    });
  });

  it('returns authorization error response when authorize fails', async () => {
    const errorResponse = new Response('forbidden', { status: 403 });
    authorize.mockResolvedValue({ type: 'error', response: errorResponse });

    const { GET } = await import('./route');
    const response = await GET(new Request('http://localhost:3000/api/v1/tag-types'));

    expect(response).toBe(errorResponse);
  });

  it('returns 503 when database is unavailable', async () => {
    authorize.mockResolvedValue({ type: 'ok', user: { userId: 'user-1' } });
    dbRef.current = undefined;

    const { GET } = await import('./route');
    const response = await GET(new Request('http://localhost:3000/api/v1/tag-types'));

    expect(response.status).toBe(503);
  });
});

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
  topics: {
    id: 'topics.id',
    name: 'topics.name',
    subjectId: 'topics.subject_id',
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: unknown[]) => ({ eq: args })),
  asc: vi.fn((...args: unknown[]) => ({ asc: args })),
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  dbRef.current = undefined;
});

function createSelectMock(result: unknown[]) {
  const orderBy = vi.fn(async () => result);
  const where = vi.fn(() => ({ orderBy }));
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));
  return { select, from, where, orderBy };
}

function buildRequest(url: string) {
  return new NextRequest(new Request(url));
}

function buildContext(subjectId?: string) {
  return { params: Promise.resolve(subjectId ? { id: subjectId } : {}) } as const;
}

describe('GET /api/v1/subjects/:id/topics', () => {
  it('returns topics for the subject', async () => {
    authorize.mockResolvedValue({
      type: 'ok',
      user: { userId: 'user-1', scopes: ['profile:read'], source: 'bearer', tokenType: 'access' },
    });
    const rows = [{ id: 'topic-1', name: '確率' }];
    const mocks = createSelectMock(rows);
    dbRef.current = { select: mocks.select };

    const { GET } = await import('./route');
    const response = await GET(buildRequest('http://localhost/api/v1/subjects/subj-1/topics'), buildContext('subj-1'));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.items).toEqual(rows);
    expect(mocks.select).toHaveBeenCalledTimes(1);
  });

  it('returns 400 when subject id is missing', async () => {
    authorize.mockResolvedValue({
      type: 'ok',
      user: { userId: 'user-1', scopes: ['profile:read'], source: 'bearer', tokenType: 'access' },
    });
    dbRef.current = { select: vi.fn() };

    const { GET } = await import('./route');
    const response = await GET(buildRequest('http://localhost/api/v1/subjects//topics'), buildContext());

    expect(response.status).toBe(400);
  });

  it('propagates authorization error response', async () => {
    const errorResponse = new Response('unauthorized', { status: 401 });
    authorize.mockResolvedValue({ type: 'error', response: errorResponse });

    const { GET } = await import('./route');
    const response = await GET(buildRequest('http://localhost/api/v1/subjects/subj-1/topics'), buildContext('subj-1'));

    expect(response).toBe(errorResponse);
  });

  it('returns 503 when database is unavailable', async () => {
    authorize.mockResolvedValue({
      type: 'ok',
      user: { userId: 'user-1', scopes: ['profile:read'], source: 'bearer', tokenType: 'access' },
    });
    dbRef.current = undefined;

    const { GET } = await import('./route');
    const response = await GET(buildRequest('http://localhost/api/v1/subjects/subj-1/topics'), buildContext('subj-1'));

    expect(response.status).toBe(503);
  });
});

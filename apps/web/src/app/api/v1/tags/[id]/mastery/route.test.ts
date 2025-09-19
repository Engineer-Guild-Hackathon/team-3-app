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
  userTagMastery: {
    userId: 'user_tag_mastery.user_id',
    tagId: 'user_tag_mastery.tag_id',
    masteryScore: 'user_tag_mastery.mastery_score',
    lastAssessedAt: 'user_tag_mastery.last_assessed_at',
    updatedAt: 'user_tag_mastery.updated_at',
  },
}));

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  dbRef.current = undefined;
});

describe('POST /api/v1/tags/:id/mastery', () => {
  it('upserts mastery entry', async () => {
    authorize.mockResolvedValue({ type: 'ok', user: { userId: 'user-1' } });
    const returning = vi.fn(() => Promise.resolve([
      { tagId: 'tag-1', masteryScore: 0.6, lastAssessedAt: new Date('2025-01-01T00:00:00Z') },
    ]));
    const onConflictDoUpdate = vi.fn(() => ({ returning }));
    const values = vi.fn(() => ({ onConflictDoUpdate }));
    const insert = vi.fn(() => ({ values }));
    dbRef.current = { insert };

    const { POST } = await import('./route');
    const response = await POST(
      buildRequest('http://localhost:3000', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masteryScore: 0.6, assessedAt: '2025-01-01T00:00:00Z' }),
      }),
      { params: Promise.resolve({ id: 'tag-1' }) }
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json).toEqual({ tagId: 'tag-1', masteryScore: 0.6, lastAssessedAt: '2025-01-01T00:00:00.000Z' });
    expect(values).toHaveBeenCalledTimes(1);
    expect(onConflictDoUpdate).toHaveBeenCalledTimes(1);
  });

  it('returns 400 when tagId is missing', async () => {
    authorize.mockResolvedValue({ type: 'ok', user: { userId: 'user-1' } });
    dbRef.current = { insert: vi.fn() };

    const { POST } = await import('./route');
    const response = await POST(buildRequest('http://localhost:3000', { method: 'POST' }), {
      params: Promise.resolve({ id: '' }),
    });

    expect(response.status).toBe(400);
  });

  it('propagates authorization error response', async () => {
    const errorResponse = new Response('unauthorized', { status: 401 });
    authorize.mockResolvedValue({ type: 'error', response: errorResponse });

    const { POST } = await import('./route');
    const response = await POST(buildRequest('http://localhost:3000', { method: 'POST' }), {
      params: Promise.resolve({ id: 'tag-1' }),
    });

    expect(response).toBe(errorResponse);
  });

  it('returns 503 when db unavailable', async () => {
    authorize.mockResolvedValue({ type: 'ok', user: { userId: 'user-1' } });
    dbRef.current = undefined;

    const { POST } = await import('./route');
    const response = await POST(buildRequest('http://localhost:3000', { method: 'POST' }), {
      params: Promise.resolve({ id: 'tag-1' }),
    });
  
    expect(response.status).toBe(503);
  });
});

function buildRequest(url: string, init?: RequestInit) {
  return new NextRequest(new Request(url, init));
}

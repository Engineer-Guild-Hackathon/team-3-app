import { afterEach, describe, expect, it, vi } from 'vitest';
import { chats, messages } from '@/db/schema';

const authorize = vi.fn();
const runChat = vi.fn();
const numericIdFromUuid = vi.fn(() => 123);
const dbRef: { current: any } = { current: undefined };

vi.mock('../_lib/auth', () => ({
  authorize,
}));

vi.mock('@/db/client', () => ({
  get db() {
    return dbRef.current;
  },
}));

vi.mock('@/lib/pipeline', () => ({
  runChat,
}));

vi.mock('@/lib/chat/id', () => ({
  numericIdFromUuid,
}));

function createInsertMocks() {
  const chatsOnConflict = vi.fn(async () => undefined);
  const chatsValues = vi.fn(() => ({ onConflictDoUpdate: chatsOnConflict }));
  const messagesValues = vi.fn(async () => undefined);
  const insert = vi.fn((table: unknown) => {
    if (table === chats) {
      return { values: chatsValues };
    }
    if (table === messages) {
      return { values: messagesValues };
    }
    return { values: vi.fn(async () => undefined) };
  });
  return { insert, chatsValues, chatsOnConflict, messagesValues };
}

function createSelectMockSequence(sequences: unknown[][]) {
  let callIndex = 0;
  return vi.fn(() => {
    const currentIndex = callIndex++;
    const chain: any = {
      from: vi.fn(() => chain),
      where: vi.fn(() => chain),
      orderBy: vi.fn(() => chain),
      limit: vi.fn(() => Promise.resolve(sequences[currentIndex] ?? [])),
    };
    return chain;
  });
}

function createUpdateMock() {
  const where = vi.fn(() => Promise.resolve());
  const set = vi.fn(() => ({ where }));
  const update = vi.fn(() => ({ set }));
  return { update, set, where };
}

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  dbRef.current = undefined;
  numericIdFromUuid.mockReturnValue(123);
});

describe('POST /api/v1/chat', () => {
  it('returns chat result when runChat succeeds', async () => {
    authorize.mockResolvedValue({
      type: 'ok',
      user: {
        userId: 'user-1',
        scopes: ['chat:rw'],
        source: 'bearer',
        tokenType: 'access',
      },
    });
    const output = { chatId: 999, answer: 'Great job!', status: 0 };
    runChat.mockResolvedValue(output);

    const { insert, chatsValues } = createInsertMocks();
    const select = createSelectMockSequence([[], []]);
    const { update } = createUpdateMock();
    dbRef.current = { insert, select, update };

    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost:3000/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientSessionId: 'chat-uuid',
          subject: '数学',
          theme: '確率',
          history: [
            { assistant: '', user: '説明します' },
          ],
        }),
      })
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.answer).toBe('Great job!');
    expect(json.status).toBe(0);
    expect(runChat).toHaveBeenCalledWith(
      expect.objectContaining({ chatId: 123 }),
      expect.any(Object)
    );
    expect(chatsValues).toHaveBeenCalled();
    expect(json.meta?.assistantPersisted).toBe(true);
  });

  it('returns 400 when body is not json', async () => {
    authorize.mockResolvedValue({
      type: 'ok',
      user: {
        userId: 'user-1',
        scopes: ['chat:rw'],
        source: 'bearer',
        tokenType: 'access',
      },
    });

    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost:3000/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not json',
      })
    );

    expect(response.status).toBe(400);
  });

  it('returns 400 when payload is invalid', async () => {
    authorize.mockResolvedValue({
      type: 'ok',
      user: {
        userId: 'user-1',
        scopes: ['chat:rw'],
        source: 'bearer',
        tokenType: 'access',
      },
    });

    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost:3000/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: '数学', theme: '確率', history: [] }),
      })
    );

    expect(response.status).toBe(400);
  });

  it('returns 400 when chat identifier is missing', async () => {
    authorize.mockResolvedValue({
      type: 'ok',
      user: {
        userId: 'user-1',
        scopes: ['chat:rw'],
        source: 'bearer',
        tokenType: 'access',
      },
    });
    runChat.mockResolvedValue({ chatId: 999, answer: 'ok', status: 0 });

    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost:3000/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: '数学',
          theme: '確率',
          history: [{ assistant: '', user: 'test' }],
        }),
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe('invalid_request');
  });

  it('returns 400 when history contains invalid entries', async () => {
    authorize.mockResolvedValue({
      type: 'ok',
      user: {
        userId: 'user-1',
        scopes: ['chat:rw'],
        source: 'bearer',
        tokenType: 'access',
      },
    });

    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost:3000/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientSessionId: 'chat-uuid',
          subject: '数学',
          theme: '確率',
          history: [{ assistant: 123, user: '説明します' }],
        }),
      })
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.code).toBe('invalid_request');
  });

  it('returns meta assistantPersisted=false when database unavailable', async () => {
    authorize.mockResolvedValue({
      type: 'ok',
      user: {
        userId: 'user-1',
        scopes: ['chat:rw'],
        source: 'bearer',
        tokenType: 'access',
      },
    });
    runChat.mockResolvedValue({ chatId: 999, answer: 'Great job!', status: 0 });
    dbRef.current = undefined;

    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost:3000/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientSessionId: 'chat-uuid',
          subject: '数学',
          theme: '確率',
          history: [{ assistant: '', user: '説明します' }],
        }),
      })
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.meta?.assistantPersisted).toBe(false);
  });

  it('returns 500 when runChat returns invalid output', async () => {
    authorize.mockResolvedValue({
      type: 'ok',
      user: {
        userId: 'user-1',
        scopes: ['chat:rw'],
        source: 'bearer',
        tokenType: 'access',
      },
    });
    runChat.mockResolvedValue({} as any);

    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost:3000/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientSessionId: 'chat-uuid',
          subject: '数学',
          theme: '確率',
          history: [{ assistant: '', user: '説明します' }],
        }),
      })
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.code).toBe('internal_error');
  });

  it('returns 500 when runChat throws error', async () => {
    authorize.mockResolvedValue({
      type: 'ok',
      user: {
        userId: 'user-1',
        scopes: ['chat:rw'],
        source: 'bearer',
        tokenType: 'access',
      },
    });
    runChat.mockRejectedValue(new Error('boom'));

    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost:3000/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientSessionId: 'chat-uuid',
          subject: '数学',
          theme: '確率',
          history: [{ assistant: '', user: '説明します' }],
        }),
      })
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.code).toBe('internal_error');
  });

  it('propagates authorization error response', async () => {
    const errorResponse = new Response('unauthorized', { status: 401 });
    authorize.mockResolvedValue({ type: 'error', response: errorResponse });

    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost:3000/api/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientSessionId: 'chat-uuid', subject: '数学', theme: '確率', history: [{ assistant: '', user: 'test' }] }),
      })
    );

    expect(response).toBe(errorResponse);
  });
});

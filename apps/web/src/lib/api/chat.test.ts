import { describe, expect, it, vi } from 'vitest';

import type { ApiClient } from '@/lib/http';
import type { RunChatInput } from '@/types/llm';
import { createChat, listChats, runChat } from './chat';

function createMockClient(response: unknown) {
  const json = vi.fn().mockResolvedValue(response);
  const client = { json } as unknown as ApiClient;
  return { client, json };
}

describe('lib/api/chat', () => {
  it('fetches chat list via /api/v1/chats and returns items', async () => {
    const rows = [{ id: 'c1', title: 'Test', status: 'in_progress', createdAt: '2025-09-18', updatedAt: '2025-09-19' }];
    const { client, json } = createMockClient({ items: rows });

    const result = await listChats(client);

    expect(json).toHaveBeenCalledWith('/api/v1/chats', undefined);
    expect(result).toEqual(rows);
  });

  it('creates chat via /api/v1/chats and returns created entity', async () => {
    const created = { id: 'c2', title: 'New chat', status: 'in_progress', createdAt: '2025-09-19', updatedAt: '2025-09-19' };
    const { client, json } = createMockClient(created);

    const result = await createChat({ title: 'New chat' }, client);

    expect(json).toHaveBeenCalledWith('/api/v1/chats', expect.objectContaining({ method: 'POST' }));
    expect(result).toEqual(created);
  });

  it('runs chat via /api/v1/chat and maps response to RunChatOutput', async () => {
    const payload: RunChatInput = { chatId: 42, subject: '数学', theme: '確率', history: [] };
    const { client, json } = createMockClient({ chatId: 'uuid', answer: 'hello', status: 0, meta: { assistantPersisted: true } });

    const data = await runChat(payload, client);

    expect(json).toHaveBeenCalledWith('/api/v1/chat', expect.objectContaining({ method: 'POST' }));
    expect(data.result).toEqual({ chatId: 42, answer: 'hello', status: 0 });
    expect(data.meta).toEqual({ assistantPersisted: true });
  });
});

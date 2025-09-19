// チャット関連のAPIラッパ（日本語コメント）

import { endpoints } from "@/lib/api/endpoints";
import type { ChatTriState, RunChatInput, RunChatOutput } from "@/types/llm";
import { apiFetchJson, ApiClient } from "@/lib/http";

export type ChatListItem = {
  id: string;
  title: string;
  status: "in_progress" | "ended";
  createdAt: string | number;
  updatedAt: string | number;
  subjectId?: string;
  subjectName?: string;
  topicId?: string;
  topicName?: string;
};

/**
 * チャット一覧の取得
 */
export async function listChats(client?: ApiClient): Promise<ChatListItem[]> {
  const exec = client ? createFetch(client) : apiFetchJson;
  const data = await exec<{ items?: ChatListItem[] }>(endpoints.chats());
  return (data?.items ?? []) as ChatListItem[];
}

/**
 * チャットの作成
 */
export async function createChat(
  input: { title?: string; subjectId?: string; topicId?: string },
  client?: ApiClient,
) {
  const exec = client ? createFetch(client) : apiFetchJson;
  const data = await exec<ChatListItem>(endpoints.chats(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input ?? {}),
  });
  return data as ChatListItem;
}

export async function renameChat(id: string, title: string, client?: ApiClient) {
  const exec = client ? createFetch(client) : apiFetchJson;
  await exec(endpoints.chatById(id), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
}

export async function deleteChat(id: string, client?: ApiClient) {
  const exec = client ? createFetch(client) : apiFetchJson;
  await exec(endpoints.chatById(id), {
    method: "DELETE",
  });
}

/**
 * チャット実行（LLM）
 */
export async function runChat(payload: RunChatInput, client?: ApiClient): Promise<{ result: RunChatOutput; meta?: any }> {
  const exec = client ? createFetch(client) : apiFetchJson;
  const data = await exec<{ chatId?: string; answer?: string; status?: ChatTriState; meta?: any }>(endpoints.chat(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result: RunChatOutput = {
    chatId: payload.chatId,
    answer: String(data.answer ?? ""),
    status: (data.status ?? 0) as ChatTriState,
  };
  return { result, meta: data.meta };
}

function createFetch(client: ApiClient) {
  return <T = any>(url: string, init?: RequestInit) => client.json<T>(url, init);
}

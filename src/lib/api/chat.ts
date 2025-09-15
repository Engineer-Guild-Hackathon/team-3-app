// チャット関連のAPIラッパ（日本語コメント）

import { endpoints } from "@/lib/api/endpoints";
import type { RunChatInput, RunChatOutput } from "@/types/llm";
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
  const data = await (client ? createFetch(client) : apiFetchJson)<{ result?: { items?: ChatListItem[] } }>(endpoints.chats());
  return (data?.result?.items ?? []) as ChatListItem[];
}

/**
 * チャットの作成
 */
export async function createChat(
  input: { title?: string; subjectId?: string; topicId?: string },
  client?: ApiClient,
) {
  const exec = client ? createFetch(client) : apiFetchJson;
  const data = await exec<{ result: ChatListItem }>(endpoints.chats(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input ?? {}),
  });
  return data.result;
}

/**
 * チャット実行（LLM）
 */
export async function runChat(payload: RunChatInput, client?: ApiClient): Promise<{ result: RunChatOutput; meta?: any }> {
  const exec = client ? createFetch(client) : apiFetchJson;
  const data = await exec<{ result: RunChatOutput; meta?: any }>(endpoints.chat(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { result: data.result, meta: (data as any).meta };
}

function createFetch(client: ApiClient) {
  return <T = any>(url: string, init?: RequestInit) => client.json<T>(url, init);
}

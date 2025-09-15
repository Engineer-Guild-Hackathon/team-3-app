// 教科/トピックの名称解決ヘルパー（日本語コメント）

import { apiFetchJson, ApiClient } from "@/lib/http";

/**
 * subjectId から名称を解決（失敗時は undefined）
 */
export async function getSubjectName(subjectId?: string, client?: ApiClient): Promise<string | undefined> {
  if (!subjectId) return undefined;
  try {
    const exec = client ? createFetch(client) : apiFetchJson;
    const data = await exec<{ result?: { items?: Array<{ id: string; name: string }> } }>("/api/subjects");
    const items = (data?.result?.items ?? []) as Array<{ id: string; name: string }>;
    return items.find((x) => x.id === subjectId)?.name;
  } catch {
    return undefined;
  }
}

/**
 * subjectId + topicId から名称を解決（失敗時は undefined）
 */
export async function getTopicName(subjectId?: string, topicId?: string, client?: ApiClient): Promise<string | undefined> {
  if (!subjectId || !topicId) return undefined;
  try {
    const exec = client ? createFetch(client) : apiFetchJson;
    const data = await exec<{ result?: { items?: Array<{ id: string; name: string }> } }>(`/api/subjects/${subjectId}/topics`);
    const items = (data?.result?.items ?? []) as Array<{ id: string; name: string }>;
    return items.find((x) => x.id === topicId)?.name;
  } catch {
    return undefined;
  }
}

function createFetch(client: ApiClient) {
  return <T = any>(url: string, init?: RequestInit) => client.json<T>(url, init);
}

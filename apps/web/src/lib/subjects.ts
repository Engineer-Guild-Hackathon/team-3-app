// 教科/トピックの名称解決ヘルパー（日本語コメント）

import { endpoints } from "@/lib/api/endpoints";
import { apiFetchJson, ApiClient } from "@/lib/http";

/**
 * subjectId から名称を解決（失敗時は undefined）
 */
export async function getSubjectName(subjectId?: string, client?: ApiClient): Promise<string | undefined> {
  if (!subjectId) return undefined;
  try {
    const exec = client ? createFetch(client) : apiFetchJson;
    const data = await exec<{ items?: Array<{ id: string; name: string }> }>(endpoints.subjects());
    const items = (data?.items ?? []) as Array<{ id: string; name: string }>;
    return items.find((x) => x.id === subjectId)?.name;
  } catch {
    return undefined;
  }
}

/**
 * subjectId + topicId から名称を解決（失敗時は undefined）
 */
export async function getTopicDetails(
  subjectId?: string,
  topicId?: string,
  client?: ApiClient,
): Promise<{ name?: string; description?: string } | undefined> {
  if (!subjectId || !topicId) return undefined;
  try {
    const exec = client ? createFetch(client) : apiFetchJson;
    const data = await exec<{ items?: Array<{ id: string; name: string; description?: string | null }> }>
      (endpoints.topicsBySubject(subjectId));
    const items = (data?.items ?? []) as Array<{ id: string; name: string; description?: string | null }>;
    const match = items.find((x) => x.id === topicId);
    if (!match) return undefined;
    return { name: match.name, description: match.description ?? undefined };
  } catch {
    return undefined;
  }
}

export async function getTopicName(subjectId?: string, topicId?: string, client?: ApiClient): Promise<string | undefined> {
  const details = await getTopicDetails(subjectId, topicId, client);
  return details?.name;
}

function createFetch(client: ApiClient) {
  return <T = any>(url: string, init?: RequestInit) => client.json<T>(url, init);
}

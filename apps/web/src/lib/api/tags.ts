import { endpoints } from './endpoints';
import { apiFetchJson } from '@/lib/http';

export type TagTypeItem = {
  id: number;
  code: string;
  label: string;
};

export type TagSummary = {
  id: string;
  name: string;
  description?: string | null;
  subjectId?: string | null;
  topicId?: string | null;
  tagTypeId: number;
};

export type ChatTagItem = {
  tagId: string;
  name?: string | null;
  tagTypeId?: number | null;
  assignedBy: 'ai' | 'user' | 'system';
  confidence: number;
  createdAt: string;
};

export type TagMasteryItem = {
  tagId: string;
  masteryScore: number;
  lastAssessedAt?: string | null;
};

export async function fetchTagTypes(): Promise<TagTypeItem[]> {
  const data = await apiFetchJson<{ items?: TagTypeItem[] }>(endpoints.tagTypes());
  return data.items ?? [];
}

export async function fetchTags(params: { subjectId?: string | null; topicId?: string | null; tagTypeId?: number | null } = {}): Promise<TagSummary[]> {
  const query = new URLSearchParams();
  if (params.subjectId) query.set('subjectId', params.subjectId);
  if (params.topicId) query.set('topicId', params.topicId);
  if (params.tagTypeId != null) query.set('tagTypeId', String(params.tagTypeId));
  const url = query.toString() ? `${endpoints.tags()}?${query.toString()}` : endpoints.tags();
  const data = await apiFetchJson<{ items?: TagSummary[] }>(url);
  return data.items ?? [];
}

export async function fetchChatTags(chatId: string): Promise<ChatTagItem[]> {
  const data = await apiFetchJson<{ items?: ChatTagItem[] }>(endpoints.chatTags(chatId));
  return data.items ?? [];
}

export async function attachChatTag(chatId: string, payload: { tagId: string; assignedBy?: 'ai' | 'user' | 'system'; confidence?: number }): Promise<void> {
  await apiFetchJson(endpoints.chatTags(chatId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tagId: payload.tagId,
      assignedBy: payload.assignedBy ?? 'user',
      confidence: payload.confidence ?? 1,
    }),
  });
}

export async function detachChatTag(chatId: string, tagId: string): Promise<void> {
  await apiFetchJson(endpoints.chatTagById(chatId, tagId), {
    method: 'DELETE',
  });
}

export async function fetchTagMastery(): Promise<TagMasteryItem[]> {
  const data = await apiFetchJson<{ items?: TagMasteryItem[] }>(endpoints.tagMastery());
  return data.items ?? [];
}

export async function updateTagMastery(tagId: string, masteryScore: number, assessedAt?: string): Promise<TagMasteryItem> {
  const data = await apiFetchJson<TagMasteryItem>(endpoints.tagMasteryByTag(tagId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ masteryScore, assessedAt }),
  });
  return data;
}

// チャットステータス関連のユーティリティ（日本語コメント）

import type { ChatMessage } from "@/types/chat";
import type { ChatStates } from "@/types/llm";

export type AssistantStatusKey = -1 | 0 | 1;

export const ASSISTANT_STATUS_META: Record<AssistantStatusKey, { label: string; palette: 'sky' | 'amber' | 'emerald' }> = {
  [-1]: { label: '進行中', palette: 'sky' },
  [0]: { label: '再質問', palette: 'amber' },
  [1]: { label: '解決', palette: 'emerald' },
};

// AI応答ステータスが3値のいずれかか判定する（日本語コメント）
export function isAssistantStatusKey(value: ChatStates | undefined): value is AssistantStatusKey {
  return value === -1 || value === 0 || value === 1;
}

// 最新のAI応答ステータスを取得する（日本語コメント）
export function getLatestAssistantStatus(messages?: ChatMessage[]): AssistantStatusKey | undefined {
  if (!Array.isArray(messages) || messages.length === 0) return undefined;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];
    if (msg.role !== "assistant") continue;
    if ((msg.status as number | undefined) === -2 || (msg.status as number | undefined) === 999) {
      return -1;
    }
    if (isAssistantStatusKey(msg.status)) {
      return msg.status;
    }
  }
  return undefined;
}

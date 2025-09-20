// ステータス表示用のユーティリティ（日本語コメント）

import type {
  AssistantRawStatus,
  AssistantStatusKey,
  ChatMessage,
} from "../components/types";

export type AssistantStatusMeta = {
  label: string;
  badgeBackground: string;
  badgeBorder: string;
  badgeText: string;
  accent: string;
};

export const ASSISTANT_STATUS_META: Record<AssistantStatusKey, AssistantStatusMeta> = {
  [-1]: {
    label: "進行中",
    badgeBackground: "rgba(14, 165, 233, 0.16)",
    badgeBorder: "rgba(56, 189, 248, 0.4)",
    badgeText: "#0369a1",
    accent: "#0ea5e9",
  },
  [0]: {
    label: "再質問",
    badgeBackground: "rgba(245, 158, 11, 0.16)",
    badgeBorder: "rgba(251, 191, 36, 0.4)",
    badgeText: "#92400e",
    accent: "#f59e0b",
  },
  [1]: {
    label: "解決",
    badgeBackground: "rgba(16, 185, 129, 0.16)",
    badgeBorder: "rgba(110, 231, 183, 0.4)",
    badgeText: "#047857",
    accent: "#10b981",
  },
};

// APIから返るステータス値をUI用の3値に正規化する（日本語コメント）
export function normalizeAssistantStatus(
  status: AssistantRawStatus | null | undefined,
): AssistantStatusKey | undefined {
  if (status === -2 || status === 999) {
    return -1;
  }
  if (status === -1 || status === 0 || status === 1) {
    return status;
  }
  return undefined;
}

// メッセージ列の末尾から最新のAI応答ステータスを抽出する（日本語コメント）
export function getLatestAssistantStatus(
  messages?: ChatMessage[],
): AssistantStatusKey | undefined {
  if (!Array.isArray(messages) || messages.length === 0) {
    return undefined;
  }
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const candidate = messages[index];
    if (!candidate || candidate.author !== "assistant" || candidate.pending) {
      continue;
    }
    const normalized = normalizeAssistantStatus(candidate.status);
    if (normalized != null) {
      return normalized;
    }
  }
  return undefined;
}

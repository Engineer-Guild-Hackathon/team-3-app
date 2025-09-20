// チャット関連の型定義（日本語コメント）

import type { ChatStates } from "@/types/llm";

export type ChatRole = "user" | "assistant" | "system";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  status?: ChatStates;
};

export type ChatSession = {
  id: string;
  title: string;
  // ステータス（in_progress | ended）。ended の場合は送受信不能。
  status?: "in_progress" | "ended";
  // 学習選択: 教科/分野（任意）
  subjectId?: string;
  subjectName?: string;
  topicId?: string;
  topicName?: string;
  prefTopicName?: string;
  topicDescription?: string;
  prefTopicDescription?: string;
  messages: ChatMessage[];
  updatedAt: number;
};

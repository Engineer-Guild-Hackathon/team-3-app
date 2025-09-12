// チャット関連の型定義（日本語コメント）

export type ChatRole = "user" | "assistant" | "system";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
};

export type ChatSession = {
  id: string;
  title: string;
  // ステータス（in_progress | ended）。ended の場合は送受信不能。
  status?: "in_progress" | "ended";
  messages: ChatMessage[];
  updatedAt: number;
};

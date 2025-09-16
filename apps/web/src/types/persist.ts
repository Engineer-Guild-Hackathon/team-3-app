import type { LlmMessage } from "@/types/llm";

export type StoredMessage = LlmMessage & {
  // 既定では LlmMessage と同様。必要に応じてメタを足せるよう拡張余地を残す
  id?: string;
  createdAt?: number;
};

export type LlmCallRecord = {
  requestId: string;
  sessionId: string;
  model: string;
  hasSystem: boolean;
  inputCount: number; // 投入メッセージ数
  responseId?: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  rawText: string; // LLM 応答の生テキスト
  json: Record<string, unknown>; // パース済みJSON
  createdAt: number;
};

export type ConversationRepository = {
  // セッションの履歴を置き換える（idempotent）
  replaceHistory(sessionId: string, messages: StoredMessage[]): Promise<void>;
  // 履歴を取得（末尾から最大 limit 件）
  getHistory(sessionId: string, limit: number): Promise<StoredMessage[]>;
  // メッセージを追記（履歴末尾に追加）
  appendMessages(sessionId: string, messages: StoredMessage[]): Promise<void>;
  // LLM 呼び出しレコードを保存
  saveLlmCall(record: LlmCallRecord): Promise<void>;
  // セッションを削除（オプション実装）
  clearSession?(sessionId: string): Promise<void>;
};


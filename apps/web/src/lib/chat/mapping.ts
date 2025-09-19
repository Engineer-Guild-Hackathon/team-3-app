// 会話履歴の相互変換ユーティリティ（日本語コメント）

import type { ChatMessage } from "@/types/chat";
import type { ConversationTurn, LlmMessage, ChatStates } from "@/types/llm";

/**
 * ChatMessage[]（user/assistant）を ConversationTurn[] へ変換する。
 * - 送信ロジックで使用（バックエンドへ渡す形式）
 */
export function messagesToTurns(messages: ChatMessage[]): ConversationTurn[] {
  const turns: ConversationTurn[] = [];
  let pendingA = "";
  let pendingU = "";
  let pendingAStatus: ChatStates | undefined;
  let pendingUStatus: ChatStates | undefined;
  for (const m of messages) {
    if (m.role === "assistant") {
      if (pendingA || pendingU) {
        turns.push({
          assistant: pendingA,
          assistantStatus: pendingAStatus,
          user: pendingU,
          userStatus: pendingUStatus,
        });
        pendingA = "";
        pendingU = "";
        pendingAStatus = undefined;
        pendingUStatus = undefined;
      }
      pendingA = m.content;
      pendingAStatus = m.status;
    } else if (m.role === "user") {
      if (pendingU) {
        turns.push({
          assistant: pendingA,
          assistantStatus: pendingAStatus,
          user: pendingU,
          userStatus: pendingUStatus,
        });
        pendingA = "";
        pendingU = "";
        pendingAStatus = undefined;
        pendingUStatus = undefined;
      }
      pendingU = m.content;
      pendingUStatus = m.status;
      // assistant が未到着でも一旦ペアとして確定
      turns.push({
        assistant: pendingA,
        assistantStatus: pendingAStatus,
        user: pendingU,
        userStatus: pendingUStatus,
      });
      pendingA = "";
      pendingU = "";
      pendingAStatus = undefined;
      pendingUStatus = undefined;
    }
  }
  if (pendingA || pendingU) {
    turns.push({
      assistant: pendingA,
      assistantStatus: pendingAStatus,
      user: pendingU,
      userStatus: pendingUStatus,
    });
  }
  return turns;
}

/**
 * ConversationTurn[] を LlmMessage[]（OpenAI Chat Completions互換）へ変換する。
 * - サーバ側パイプラインで使用
 */
export function turnsToMessages(turns: ConversationTurn[]): LlmMessage[] {
  const out: LlmMessage[] = [];
  for (let i = 0; i < turns.length; i++) {
    const t = turns[i];
    if (t?.assistant && t.assistant.trim().length > 0) {
      out.push({ role: "assistant", content: String(t.assistant) });
    }
    if (t?.user && t.user.trim().length > 0) {
      out.push({ role: "user", content: String(t.user) });
    }
  }
  return out;
}

import type { RunChatOutput } from "@/types/llm";
import type { RunChatInput, ConversationTurn, ChatStates } from "@/types/llm";

export function isRunChatOutput(val: unknown): val is RunChatOutput {
  if (typeof val !== "object" || val === null) return false;
  const o = val as any;
  const chatIdOk = typeof o.chatId === "number" && Number.isFinite(o.chatId);
  const answerOk = typeof o.answer === "string";
  const statusOk = isChatTriState(o.status);
  return chatIdOk && answerOk && statusOk;
}

export function isConversationTurn(v: unknown): v is ConversationTurn {
  if (typeof v !== "object" || v === null) return false;
  const o = v as any;
  const assistantOk = typeof o.assistant === "string";
  const userOk = typeof o.user === "string";
  const assistantStatusOk =
    o.assistantStatus == null || (typeof o.assistantStatus === "number" && isChatTriState(o.assistantStatus));
  const userStatusOk = o.userStatus == null || (typeof o.userStatus === "number" && isChatTriState(o.userStatus));
  return assistantOk && userOk && assistantStatusOk && userStatusOk;
}

export function isChatTriState(v: unknown): v is ChatStates {
  return v === -1 || v === 0 || v === 1 || v === 999;
}

export function isRunChatInput(val: unknown): val is RunChatInput {
  if (typeof val !== "object" || val === null) return false;
  const o = val as any;
  const idOk = typeof o.chatId === "number" && Number.isFinite(o.chatId);
  const subjectOk = typeof o.subject === "string";
  const themeOk = typeof o.theme === "string";
  const historyOk = Array.isArray(o.history) && o.history.every(isConversationTurn);
  const descOk = o.description == null || typeof o.description === "string";
  const clientIdOk = o.clientSessionId == null || typeof o.clientSessionId === "string";
  return idOk && subjectOk && themeOk && historyOk && descOk && clientIdOk;
}

/**
 * LLMの素の出力（answer/status のみ）を判定するための軽量ガード。
 * - パイプライン内部で JSON を組み立てる前段の検証に使用する。
 */
export function isAnswerWithStatus(val: unknown): val is { answer: string; status: ChatStates } {
  if (typeof val !== "object" || val === null) return false;
  const o = val as any;
  const answerOk = typeof o.answer === "string";
  const statusOk = isChatTriState(o.status);
  return answerOk && statusOk;
}

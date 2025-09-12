import type { RunChatOutput } from "@/types/llm";
import type { RunChatInput, ConversationTurn, ChatTriState } from "@/types/llm";

export function isRunChatOutput(val: unknown): val is RunChatOutput {
  if (typeof val !== "object" || val === null) return false;
  const o = val as any;
  const chatIdOk = typeof o.chatId === "number" && Number.isFinite(o.chatId);
  const answerOk = typeof o.answer === "string";
  const statusOk = o.status === -1 || o.status === 0 || o.status === 1;
  return chatIdOk && answerOk && statusOk;
}

export function isConversationTurn(v: unknown): v is ConversationTurn {
  if (typeof v !== "object" || v === null) return false;
  const o = v as any;
  return typeof o.assistant === "string" && typeof o.user === "string";
}

export function isChatTriState(v: unknown): v is ChatTriState {
  return v === -1 || v === 0 || v === 1;
}

export function isRunChatInput(val: unknown): val is RunChatInput {
  if (typeof val !== "object" || val === null) return false;
  const o = val as any;
  const idOk = typeof o.chatId === "number" && Number.isFinite(o.chatId);
  const subjectOk = typeof o.subject === "string";
  const themeOk = typeof o.theme === "string";
  const historyOk = Array.isArray(o.history) && o.history.every(isConversationTurn);
  return idOk && subjectOk && themeOk && historyOk;
}

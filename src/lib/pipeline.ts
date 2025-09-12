import { getAOAI } from "./openai";
import { getLogger } from "./logger";
import { isRunChatOutput } from "./schemas";
import type {
  LlmMessage,
  RunChatOptions,
  RunChatInput,
  RunChatOutput,
  ChatTriState,
  ConversationTurn,
} from "@/types/llm";

// ------------------------------
// ヘルパー（共通処理）
// ------------------------------

/**
 * JSON モードの要件を満たすため、メッセージ内に小文字 "json" が含まれるよう保証する。
 * 必要なら先頭に system:"json" を注入する。
 */

/**
 * runChat 用の system プロンプトを組み立てる
 */
function buildRunChatSystemPrompt(subject: string, theme: string, status: ChatTriState): string {
  return `You are a helpful assistant. Subject: ${subject}. Theme: ${theme}. Status: ${status}. Answer clearly in plain text.`;
}

/**
 * { assistant, user } のターン配列を ChatCompletion メッセージ配列へ展開する
 */
function mapTurnsToMessages(turns: ConversationTurn[]): LlmMessage[] {
  const out: LlmMessage[] = [];
  for (let i = 0; i < turns.length; i++) {
    const t = turns[i];
    if (t?.assistant) out.push({ role: "assistant", content: String(t.assistant) });
    if (t?.user) out.push({ role: "user", content: String(t.user) });
  }
  return out;
}

/**
 * Chat補完（最終動作のみ）
 * - JSON モード（response_format: json_object）で応答を取得
 * - 先頭に JSON 専用システム指示を注入（オプション）
 */
/**
 * JSON モードでの 1 回分の応答取得
 * - 入力: 任意の ChatCompletion メッセージ列
 * - 出力: { json, text }（JSON はオブジェクト形状に正規化）
 */

/**
 * runChat: 型指定の入出力でテキスト回答を得る関数
 * - 入力: { chatId, subject, theme, history[], status }
 * - 出力: { chatId, answer, status }
 * - JSON モードは使わず、プレーンテキストで回答
 */
/**
 * 型付きの runChat
 * - 入力: RunChatInput（chatId/subject/theme/history/status）
 * - 出力: RunChatOutput（chatId/answer/status）
 * - 返却形は isRunChatOutput で検証してから返す
 */
export async function runChat(input: RunChatInput, opts: Partial<RunChatOptions> = {}): Promise<RunChatOutput> {
  const log = getLogger("pipeline");
  const model = process.env.AZURE_OPENAI_DEPLOYMENT!;

  // ステータスを -1 | 0 | 1 に正規化し、以降で使用
  const inputStatus: ChatTriState = (input.status < 0 ? -1 : input.status > 0 ? 1 : 0) as ChatTriState;

  const sessionId = opts.sessionId ?? `chat:${input.chatId}`;
  const requestId = opts.requestId ?? crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

  log.info({ msg: "runChat:start", sessionId, requestId, chatId: input.chatId, status: inputStatus });

  // subject/theme を system に集約。history は {assistant,user} のペアを assistant→user の順で展開
  const sys = buildRunChatSystemPrompt(input.subject, input.theme, inputStatus);
  const turns: ConversationTurn[] = input.history ?? [];
  const messages: LlmMessage[] = [{ role: "system", content: sys }, ...mapTurnsToMessages(turns)];
  log.debug({ msg: "runChat:history_mapped", turns: turns.length, messages: messages.length });

  const t0 = Date.now();
  const resp = await getAOAI().chat.completions.create({ model, messages } as any);
  const dt = Date.now() - t0;
  const answer = resp.choices?.[0]?.message?.content?.trim?.() ?? "";

  // 回答本文は長くなるため、ログには文字数のみを出力
  log.info({ msg: "runChat:final", sessionId, requestId, chatId: input.chatId, ms: dt, chars: answer.length });

  // 成功: 1、未回答: 0、例外時: -1（catch 側）
  const out: RunChatOutput = { chatId: input.chatId, answer, status: answer ? 1 : 0 };
  if (isRunChatOutput(out)) {
    log.debug({ msg: "runChat:output_valid", chatId: out.chatId, status: out.status, hasAnswer: out.answer.length > 0 });
    return out;
  }
  // フォールバック（ここに来ない想定だが、安全のため）
  log.error({ msg: "runChat:output_invalid", chatId: input.chatId });
  return { chatId: input.chatId, answer: String(answer ?? ""), status: answer ? 1 : 0 };
}

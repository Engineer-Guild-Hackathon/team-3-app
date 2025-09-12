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
import { getRunChatSystemPrompt } from "./prompts";

// ------------------------------
// ヘルパー（共通処理）
// ------------------------------

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
 * runChat: 型指定の入出力でテキスト回答を得る関数
 * - 入力: { chatId, subject, theme, history[], status }
 * - 出力: { chatId, answer, status }
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

  const sessionId = opts.sessionId ?? `chat:${input.chatId}`;
  const requestId = opts.requestId ?? crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

  log.info({ msg: "runChat:start", sessionId, requestId, chatId: input.chatId });

  // subject/theme をテンプレへ注入した system 指示を使用
  const sys = await getRunChatSystemPrompt(input.subject, input.theme);
  const turns: ConversationTurn[] = input.history ?? [];
  const messages: LlmMessage[] = [{ role: "system", content: sys }, ...mapTurnsToMessages(turns)];
  if (turns.length === 0) {
    // 履歴が無い場合は、初回応答を生成するための合成ユーザープロンプトを付与（UIには表示しない）
    const kickoff = `テーマ「${input.theme}」の基礎と直感的な説明を簡潔に述べ、身近な例を1つ挙げ、次の一歩を1つ提案してください。`;
    messages.push({ role: "user", content: kickoff });
    log.debug({ msg: "runChat:kickoff_injected" });
  }
  log.debug({ msg: "runChat:history_mapped", turns: turns.length, messages: messages.length });

  // JSON Schema で構造化出力を強制（answer/status のみ）
  const response_format = {
    type: "json_schema",
    json_schema: {
      name: "run_chat_output",
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          answer: { type: "string" },
          status: { type: "integer", enum: [-1, 0, 1] },
        },
        required: ["answer", "status"],
      },
      strict: true,
    },
  } as const;

  const t0 = Date.now();
  const resp = await getAOAI().chat.completions.create({ model, messages, response_format } as any);
  const dt = Date.now() - t0;

  const raw = resp.choices?.[0]?.message?.content ?? "";
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = null;
  }

  let out: RunChatOutput;
  if (parsed && typeof parsed === "object" && isRunChatOutput(parsed)) {
    out = parsed as RunChatOutput;
  } else {
    // フォールバック：スキーマ外の応答やパース失敗時
    const fallbackAnswer = String(raw || "").trim();
    const fallbackStatus: ChatTriState = fallbackAnswer ? 0 : 0;
    out = { chatId: input.chatId, answer: fallbackAnswer, status: fallbackStatus };
  }

  // 回答本文は長くなるため、ログには文字数のみを出力
  log.info({ msg: "runChat:final", sessionId, requestId, chatId: input.chatId, ms: dt, chars: out.answer.length, status: out.status });
  return out;
}

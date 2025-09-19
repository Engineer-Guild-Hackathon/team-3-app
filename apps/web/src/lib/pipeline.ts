import { getAOAI, runPromptShield, type PromptShieldEvaluation } from "./openai";
import { getLogger } from "./logger";
import { isRunChatOutput, isAnswerWithStatus } from "./schemas";
import type {
  LlmMessage,
  RunChatOptions,
  RunChatInput,
  RunChatOutput,
  ChatStates,
  ConversationTurn,
} from "@/types/llm";
import { getRunChatSystemPrompt } from "./prompts";
import { turnsToMessages } from "@/lib/chat/mapping";

function sanitizeHistory(turns: ConversationTurn[]): ConversationTurn[] {
  if (!turns.length) return turns;
  const cloned = turns.map((turn) => ({ ...turn }));
  for (let i = 0; i < cloned.length; i++) {
    const turn = cloned[i];
    if (turn.assistantStatus === 999) {
      cloned[i] = {
        ...turn,
        assistant: "",
        assistantStatus: undefined,
      };
      if (i > 0) {
        cloned[i - 1] = {
          ...cloned[i - 1],
          user: "",
          userStatus: undefined,
        };
      }
    }
  }
  return cloned.filter((turn) => {
    const hasAssistant = typeof turn.assistant === "string" && turn.assistant.trim().length > 0;
    const hasUser = typeof turn.user === "string" && turn.user.trim().length > 0;
    return hasAssistant || hasUser;
  });
}

// ------------------------------
// ヘルパー（共通処理）
// ------------------------------

/**
 * { assistant, user } のターン配列を ChatCompletion メッセージ配列へ展開する
 */
// 会話ターン→LLMメッセージ変換は共通ユーティリティへ集約

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

  // subject/theme/description をテンプレへ注入した system 指示を使用
  const sys = await getRunChatSystemPrompt(input.subject, input.theme, input.description ?? "");
  const turns: ConversationTurn[] = input.history ?? [];
  const rawMessages: LlmMessage[] = [{ role: "system", content: sys }, ...turnsToMessages(turns)];
  const sanitizedTurns = sanitizeHistory(turns);
  const llmMessages: LlmMessage[] = [{ role: "system", content: sys }, ...turnsToMessages(sanitizedTurns)];
  log.debug({
    msg: "runChat:history_mapped",
    turns: turns.length,
    messages: rawMessages.length,
    sanitizedTurns: sanitizedTurns.length,
    sanitizedMessages: llmMessages.length,
  });

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
          status: { type: "integer", enum: [-1, 0, 1, 999] },
        },
        required: ["answer", "status"],
      },
      strict: true,
    },
  } as const;

  let shield: PromptShieldEvaluation;
  try {
    shield = await runPromptShield(llmMessages);
    log.debug({
      msg: "runChat:prompt_shield_checked",
      sessionId,
      requestId,
      chatId: input.chatId,
      shouldBlock: shield.shouldBlock,
      attackDetected: shield.attackDetected,
      bypassDetected: shield.bypassDetected,
      attackType: shield.attackType,
      confidence: shield.confidence,
      detectors: shield.detectors,
    });
  } catch (err) {
    log.error({
      msg: "runChat:prompt_shield_error",
      sessionId,
      requestId,
      chatId: input.chatId,
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      chatId: input.chatId,
      answer: "申し訳ありません。安全チェックに失敗しました。時間を置いて再度お試しください。",
      status: -1,
    };
  }

  if (shield.shouldBlock) {
    log.warn({
      msg: "runChat:prompt_shield_blocked",
      sessionId,
      requestId,
      chatId: input.chatId,
      attackDetected: shield.attackDetected,
      bypassDetected: shield.bypassDetected,
      attackType: shield.attackType,
      confidence: shield.confidence,
      detectors: shield.detectors,
    });
    const safeAnswer =
      "ごめんなさい。安全確認が必要な内容だったので、言い方を少し変えてもう一度送ってくれると助かります。";
    return { chatId: input.chatId, answer: safeAnswer, status: 999 };
  }

  const t0 = Date.now();
  const resp = await getAOAI().chat.completions.create({ model, messages: llmMessages, response_format } as any);
  const dt = Date.now() - t0;

  const raw = resp.choices?.[0]?.message?.content ?? "";
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = null;
  }

  // 使用トークン情報（あれば）
  const usage = (resp as any)?.usage ?? null;
  const finishReason = (resp as any)?.choices?.[0]?.finish_reason ?? null;

  let out: RunChatOutput;
  if (parsed && typeof parsed === "object" && isAnswerWithStatus(parsed)) {
    // LLM の素の JSON（answer/status のみ）を最終形へマッピング
    out = { chatId: input.chatId, answer: (parsed as any).answer, status: (parsed as any).status };
  } else if (parsed && typeof parsed === "object" && isRunChatOutput(parsed)) {
    // 互換: もし chatId を含む完全形で返ってきた場合
    out = parsed as RunChatOutput;
  } else {
    // フォールバック：スキーマ外の応答やパース失敗時
    const fallbackAnswer = String(raw || "").trim();
    const fallbackStatus: ChatStates = fallbackAnswer ? 0 : 0;
    out = { chatId: input.chatId, answer: fallbackAnswer, status: fallbackStatus };
  }

  // 回答本文は長くなるため、ログには文字数のみを出力
  log.info({
    msg: "runChat:final",
    sessionId,
    requestId,
    chatId: input.chatId,
    ms: dt,
    chars: out.answer.length,
    status: out.status,
    usage,
    finish_reason: finishReason,
  });
  return out;
}

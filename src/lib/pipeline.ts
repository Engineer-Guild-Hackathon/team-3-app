import { getAOAI } from "./openai";
import { getLogger } from "./logger";
import { getPrompt, DEFAULT_JSON_MODE_SYSTEM } from "./prompts";
import type { LlmMessage, JsonResult, RunChatOptions } from "@/types/llm";

// 簡易会話メモリ（サーバプロセス内、セッションID単位）
const conversationStore = new Map<string, LlmMessage[]>();

function clampHistory(arr: LlmMessage[], max: number): LlmMessage[] {
  if (arr.length <= max) return arr;
  return arr.slice(arr.length - max);
}

/**
 * Chat補完（最終動作のみ）
 * - JSON モード（response_format: json_object）で応答を取得
 * - 先頭に JSON 専用システム指示を注入（オプション）
 */
export async function runChatWithTools(
  initialMessages: LlmMessage[],
  options: RunChatOptions = { injectJsonSystemPrompt: true }
): Promise<JsonResult> {
  const log = getLogger("pipeline");
  const sessionId = options.sessionId ?? "default";
  const maxHistory = Math.max(1, options.maxHistory ?? 20);
  log.info({ msg: "start", mode: "json", messageCount: initialMessages.length, sessionId, maxHistory });

  const model = process.env.AZURE_OPENAI_DEPLOYMENT!; // デプロイメント名

  // JSONモード利用時は、メッセージ内に 'json' という語を含める必要があるため
  // 必要に応じて先頭へシステムメッセージを注入する
  const jsonSystem: LlmMessage | null = options.injectJsonSystemPrompt
    ? {
        role: "system",
        content: await getPrompt("system/json-mode", DEFAULT_JSON_MODE_SYSTEM),
      }
    : null;

  // 入力メッセージをそのままセッション履歴へ反映し、上限でクリップ
  const clientHistory = clampHistory([...initialMessages], maxHistory);
  conversationStore.set(sessionId, clientHistory);

  // 送信用メッセージ = （JSONモード用システム）+（保持中の履歴）
  const history = conversationStore.get(sessionId) ?? [];
  const messages: LlmMessage[] = jsonSystem ? [jsonSystem, ...history] : [...history];

  // Azure OpenAI JSON モード要件：メッセージ内に 'json' を含める必要があるため保険をかける
  if (!messages.some((m) => m?.content?.toLowerCase?.().includes("json"))) {
    messages.unshift({ role: "system", content: "json" });
  }

  // 単発の補完（JSONモード）
  const resp = await getAOAI().chat.completions.create({
    model,
    messages,
    // JSONモード：常に有効なJSONオブジェクトを返す
    response_format: { type: "json_object" },
  } as any);

  const raw = resp.choices?.[0]?.message?.content ?? "{}";
  log.debug({ msg: "received", bytes: Buffer.byteLength(raw, "utf8") });

  // パース失敗時も堅牢にフォールバック
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(raw);
  } catch {
    // 念のためトリム等を試し、それでも失敗したら空オブジェクト
    try {
      parsed = JSON.parse(raw.trim());
    } catch {
      parsed = {};
    }
  }

  const text = JSON.stringify(parsed, null, 2);
  // 応答（assistant）を履歴へ追記し、上限でクリップ
  const after = clampHistory([...(conversationStore.get(sessionId) ?? []), { role: "assistant", content: raw }], maxHistory);
  conversationStore.set(sessionId, after);

  log.info({ msg: "final", ok: true, model, hasSystem: !!jsonSystem, sessionId, historySize: after.length });
  return { json: parsed, text };
}

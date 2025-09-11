import { getAOAI } from "./openai";
import { getLogger } from "./logger";
import type { LlmMessage, JsonModeOptions, JsonResult } from "@/types/llm";

/**
 * Chat補完（最終動作のみ）
 * - JSON モード（response_format: json_object）で応答を取得
 * - 先頭に JSON 専用システム指示を注入（オプション）
 */
export async function runChatWithTools(
  initialMessages: LlmMessage[],
  options: JsonModeOptions = { injectJsonSystemPrompt: true }
): Promise<JsonResult> {
  const log = getLogger("pipeline");
  log.info({ msg: "start", mode: "json", messageCount: initialMessages.length });

  const model = process.env.AZURE_OPENAI_DEPLOYMENT!; // デプロイメント名

  // JSONモード利用時は、メッセージ内に 'json' という語を含める必要があるため
  // 必要に応じて先頭へシステムメッセージを注入する
  const jsonSystem: LlmMessage | null = options.injectJsonSystemPrompt
    ? {
        role: "system",
        content:
          "Return only a valid JSON object. No code fences, no extra text. Keys may include additional, future fields (extensible).",
      }
    : null;

  const messages: LlmMessage[] = jsonSystem
    ? [jsonSystem, ...initialMessages]
    : [...initialMessages];

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
  log.info({ msg: "final", ok: true, model, hasSystem: !!jsonSystem });
  return { json: parsed, text };
}

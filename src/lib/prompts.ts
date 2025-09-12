import { readFile } from "fs/promises";
import path from "path";
import { getLogger } from "./logger";

// プロンプトローダー（テキストファイルから読み込み、メモリキャッシュ）

const cache = new Map<string, string>();
const log = getLogger("prompts");

/**
 * 指定名のプロンプトを読み込み（prompts/<name>.txt）。
 * 見つからない場合は fallback を返す（未指定なら例外）。
 */
export async function getPrompt(name: string, fallback?: string): Promise<string> {
  if (cache.has(name)) return cache.get(name)!;
  const file = path.resolve(process.cwd(), "prompts", `${name}.txt`);
  try {
    const buf = await readFile(file);
    const text = buf.toString("utf8");
    cache.set(name, text);
    log.debug({ msg: "loaded", name, bytes: buf.byteLength });
    return text;
  } catch (e) {
    if (fallback != null) {
      log.warn({ msg: "fallback", name, reason: "not found or unreadable" });
      cache.set(name, fallback);
      return fallback;
    }
    log.error({ msg: "missing", name });
    throw e;
  }
}

// よく使うデフォルト（日本語コメント）
export const DEFAULT_SYSTEM_BASE_JA = "あなたは役に立つアシスタントです。";
export const DEFAULT_JSON_MODE_SYSTEM =
  "Return only a valid json object. No code fences, no extra text. Keys may include additional, future fields (extensible).";

// ------------------------------
// テンプレートレンダリング（{{key}} を置換）
// ------------------------------

export function renderTemplate(tpl: string, vars: Record<string, string | number>): string {
  return tpl.replace(/{{\s*(\w+)\s*}}/g, (_, k: string) => String(vars[k] ?? ""));
}

/**
 * runChat 用の system プロンプトを、単一テキスト（prompts/run-chat.txt）から読み込んで生成
 * - 置換キー: {{subject}}, {{theme}}, {{status}}
 * - テンプレの内容のみを変更すれば挙動を変えられる
 */
export async function getRunChatSystemPrompt(subject: string, theme: string, status: number): Promise<string> {
  const fallback = [
    "You are a helpful assistant.",
    "Subject: {{subject}}",
    "Theme: {{theme}}",
    "Status: {{status}}",
    "Answer clearly in plain text.",
  ].join("\n");
  const tpl = await getPrompt("run-chat", fallback);
  const rendered = renderTemplate(tpl, { subject, theme, status });
  log.debug({ msg: "rendered", name: "run-chat", chars: rendered.length });
  return rendered;
}

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

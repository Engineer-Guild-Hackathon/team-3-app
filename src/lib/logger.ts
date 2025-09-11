import pino from "pino";
import type { TransportSingleOptions } from "pino";
import { createRequire } from "module";

// 共通ロガー（サーバ専用）。ログ本文は英語で統一する

const isProd = process.env.NODE_ENV === "production";
const level = process.env.LOG_LEVEL ?? (isProd ? "info" : "debug");
const enablePretty = !isProd && (process.env.LOG_PRETTY ?? "1") !== "0";

// pino-pretty を解決できる場合のみ transport を設定（バンドラ/環境差異に強くするための対策）
function getPrettyTransport(): TransportSingleOptions | undefined {
  if (!enablePretty) return undefined;
  try {
    const req = createRequire(import.meta.url);
    const target = req.resolve("pino-pretty");
    // Next.js (Turbopack) でも解決できなければ undefined を返す
    if (!target || typeof target !== "string") return undefined;
    return {
      target,
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        singleLine: false,
        ignore: "pid,hostname,service,env",
        messageFormat: "{msg}",
      },
    } satisfies TransportSingleOptions;
  } catch {
    // runtime note for developers (not user-facing)
    // eslint-disable-next-line no-console
    console.warn("[logger] pino-pretty not available. Falling back to JSON logs.");
    return undefined;
  }
}

const redactPaths = [
  // 認証・機密系ヘッダ/キー
  "req.headers.authorization",
  "request.headers.authorization",
  // ハイフンを含むキーは bracket 記法で指定
  'response.headers["set-cookie"]',
  "req.headers.cookie",
  "request.headers.cookie",
  "cookies",
  // よくあるシークレット環境変数
  "env.OPENAI_API_KEY",
  "env.AZURE_OPENAI_KEY",
  "env.AZURE_TENANT_ID",
  "env.AZURE_CLIENT_ID",
  "env.AZURE_CLIENT_SECRET",
];

const base = {
  service: process.env.SERVICE_NAME ?? "team-3-app",
  env: process.env.NODE_ENV ?? "development",
};

export const logger = pino({
  level,
  base,
  redact: { paths: redactPaths, remove: true },
  // ISO 8601 で時刻出力
  timestamp: pino.stdTimeFunctions.isoTime,
  // ログ整形（レベル表記の簡素化・pid/hostname の非表示など）
  formatters: {
    level(label) {
      return { level: label.toUpperCase() };
    },
    // Turbopack/Next.js 環境では pid/hostname は不要なので除外
    bindings() {
      return {};
    },
  },
  // dev のみ pino-pretty（解決できた場合のみ）
  transport: getPrettyTransport(),
  // error フィールドのキーを明示
  errorKey: "err",
});

/**
 * スコープ付きロガー（モジュール/機能単位）を返すユーティリティ
 */
export function getLogger(scope?: string) {
  return scope ? logger.child({ scope }) : logger;
}

import pino from "pino";
import { createRequire } from "module";

// 共通ロガー（サーバ専用）

const isProd = process.env.NODE_ENV === "production";
const level = process.env.LOG_LEVEL ?? (isProd ? "info" : "debug");
const enablePretty = !isProd && (process.env.LOG_PRETTY ?? "1") !== "0";

// 開発時は worker ベースの transport を使わず、同期ストリームで整形（Turbopack との相性改善）
function getPrettyStream(): NodeJS.WritableStream | undefined {
  if (!enablePretty) return undefined;
  try {
    const req = createRequire(import.meta.url);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const prettyFactory = req("pino-pretty");
    const stream = prettyFactory({
      colorize: true,
      translateTime: "SYS:standard",
      singleLine: false,
      ignore: "pid,hostname,service,env",
      messageFormat: "{msg}",
    });
    return stream as NodeJS.WritableStream;
  } catch {
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

const pinoOptions = {
  level,
  base,
  redact: { paths: redactPaths, remove: true },
  // ISO 8601 で時刻出力
  timestamp: pino.stdTimeFunctions.isoTime,
  // ログ整形（レベル表記の簡素化・pid/hostname の非表示など）
  formatters: {
    level(label: string) {
      return { level: label.toUpperCase() };
    },
    // Turbopack/Next.js 環境では pid/hostname は不要なので除外
    bindings() {
      return {};
    },
  },
  // error フィールドのキーを明示
  errorKey: "err",
} as const;

const prettyDest = getPrettyStream();
export const logger = prettyDest ? pino(pinoOptions, prettyDest) : pino(pinoOptions);

/**
 * スコープ付きロガー（モジュール/機能単位）を返すユーティリティ
 */
export function getLogger(scope?: string) {
  return scope ? logger.child({ scope }) : logger;
}

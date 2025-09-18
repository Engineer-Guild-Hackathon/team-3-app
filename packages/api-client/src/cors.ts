// モバイル向け CORS 設定のユーティリティ

/**
 * 許可オリジン文字列をパースして整形済みリストを返す。
 */
export function parseAllowedOrigins(input: string | undefined | null): string[] {
  if (!input) return [];
  return input
    .split(/[,\n]/)
    .map((value) => normalizeOrigin(value))
    .filter((value): value is string => Boolean(value));
}

/**
 * オリジンを比較可能な形に正規化する。
 */
export function normalizeOrigin(origin: string | undefined | null): string | null {
  if (!origin) return null;
  const trimmed = origin.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/$/, '').toLowerCase();
}

/**
 * 指定オリジンが許可リストに含まれるかを判定する。
 */
export function isOriginAllowed(origin: string | null, allowList: readonly string[]): boolean {
  if (!origin) return false;
  if (allowList.length === 0) return true;
  const normalized = normalizeOrigin(origin);
  return normalized ? allowList.includes(normalized) : false;
}

/**
 * 環境変数 MOBILE_ALLOWED_ORIGINS を安全に読み込む。
 */
export function loadAllowedOriginsFromEnv(env: Record<string, string | undefined> = process.env): string[] {
  return parseAllowedOrigins(env.MOBILE_ALLOWED_ORIGINS);
}

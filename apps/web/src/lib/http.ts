// フロントエンド用の軽量HTTPユーティリティ（日本語コメント）

import { ApiClient, ApiClientOptions, ApiClientError } from "@/lib/api/client";
import { getValidAccessToken, invalidateStoredTokens } from "@/lib/auth/web-appjwt";

export type { ApiClientOptions, ApiClientError };
export { ApiClient };

const ABSOLUTE_URL = /^https?:\/\/\S+/i;

const RAW_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
const { baseUrl: NORMALIZED_BASE_URL, isAbsolute: IS_ABSOLUTE_BASE } = normalizeBase(RAW_BASE_URL);

const browserUnauthorizedHandler = () => {
  if (typeof window !== "undefined") window.location.href = "/login";
};

const sharedClient = new ApiClient({
  baseUrl: NORMALIZED_BASE_URL ?? undefined,
  onUnauthorized: () => {
    browserUnauthorizedHandler();
  },
});

export const defaultApiClient = sharedClient;

export function createApiFetchJson(client: ApiClient) {
  return <T = any>(url: string, init?: RequestInit) => client.json<T>(url, init);
}

/**
 * 共通の fetch JSON ヘルパー（相対URL + ベースURL解決に対応）
 */
export async function apiFetchJson<T = any>(url: string, init?: RequestInit): Promise<T> {
  const target = resolveUrlWithBase(url);
  const needsBearer = shouldAttachBearer(target);

  let attempt = 0;
  let lastError: any = null;

  while (attempt < 2) {
    const headers = new Headers(init?.headers ?? {});
    let tokenAttached = false;

    if (needsBearer) {
      try {
        const token = await getValidAccessToken(attempt > 0);
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
          tokenAttached = true;
        }
      } catch (error) {
        console.warn('Failed to prepare web access token', error);
      }
    }

    const res = await fetch(target, { ...init, headers });
    let data: any = {};
    try {
      data = await res.json();
    } catch {}

    if (res.status === 401 && tokenAttached) {
      invalidateStoredTokens();
      attempt += 1;
      lastError = new Error(String(data?.error ?? 'Unauthorized'));
      continue;
    }

    if (res.status === 401) {
      browserUnauthorizedHandler();
      const err: any = new Error('Unauthorized');
      err.status = 401;
      throw err;
    }

    if (!res.ok || data?.ok === false) {
      const err: any = new Error(String(data?.error ?? `HTTP ${res.status}`));
      err.status = res.status;
      throw err;
    }

    return data as T;
  }

  if (lastError) throw lastError;
  return {} as T;
}

function normalizeBase(raw: string): { baseUrl: string | null; isAbsolute: boolean } {
  if (!raw) return { baseUrl: null, isAbsolute: false };
  let trimmed = raw.trim();
  if (!trimmed) return { baseUrl: null, isAbsolute: false };
  // 末尾スラッシュは一つまでに揃える
  trimmed = trimmed.replace(/\/+$/, "");
  const isAbsolute = ABSOLUTE_URL.test(trimmed);
  if (!isAbsolute && !trimmed.startsWith("/")) {
    trimmed = `/${trimmed}`;
  }
  if (trimmed === "") return { baseUrl: null, isAbsolute: false };
  return { baseUrl: trimmed, isAbsolute };
}

function resolveUrlWithBase(url: string): string {
  if (!url) return url;
  if (ABSOLUTE_URL.test(url)) return url;
  const base = NORMALIZED_BASE_URL;
  if (!base) return url;
  if (IS_ABSOLUTE_BASE) {
    try {
      const resolved = new URL(url, base).toString();
      return resolved;
    } catch {}
  }
  const prefix = base.startsWith("/") ? base : `/${base}`;
  if (url === prefix || url.startsWith(`${prefix}/`)) return url;
  if (url.startsWith("/")) {
    if (prefix === "/") return url;
    return `${prefix}${url}`;
  }
  return `${prefix}/${url}`;
}

function shouldAttachBearer(url: string): boolean {
  try {
    const parsed = new URL(url, typeof window === 'undefined' ? 'http://localhost' : window.location.origin);
    return parsed.pathname.startsWith('/api/v1/');
  } catch {
    return url.startsWith('/api/v1/');
  }
}

// API クライアントの共通実装（日本語コメント）

export type ApiClientOptions = {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  defaultHeaders?: HeadersInit;
  onUnauthorized?: (response: Response) => void;
};

export type ApiClientError = Error & {
  status: number;
  body?: unknown;
};

const ABSOLUTE_URL = /^https?:\/\//i;

/**
 * Fetch ベースの薄い API クライアント
 */
export class ApiClient {
  private readonly baseUrl: string | null;
  private readonly isAbsoluteBase: boolean;
  private readonly fetchImpl: typeof fetch;
  private readonly defaultHeaders?: HeadersInit;
  private readonly onUnauthorized?: (response: Response) => void;

  constructor(options: ApiClientOptions = {}) {
    const normalized = options.baseUrl ? this.normalizeBase(options.baseUrl) : null;
    this.baseUrl = normalized;
    this.isAbsoluteBase = normalized ? ABSOLUTE_URL.test(normalized) : false;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.defaultHeaders = options.defaultHeaders;
    this.onUnauthorized = options.onUnauthorized;
  }

  /**
   * JSON レスポンスを返すリクエストヘルパー
   */
  async json<T = any>(url: string, init?: RequestInit): Promise<T> {
    const response = await this.request(url, init);
    let data: unknown = {};
    try {
      data = await response.json();
    } catch {
      data = {};
    }
    if (!response.ok || (data as any)?.ok === false) {
      throw this.buildError(response, data);
    }
    return data as T;
  }

  /**
   * Response をそのまま返すリクエストヘルパー
   */
  async request(url: string, init?: RequestInit): Promise<Response> {
    const target = this.resolveUrl(url);
    const mergedInit = this.mergeInit(init);
    const res = await this.fetchImpl(target, mergedInit);
    if (res.status === 401) {
      // 認証エラー時のフック（ブラウザ遷移など）
      this.onUnauthorized?.(res);
    }
    return res;
  }

  private mergeInit(init?: RequestInit): RequestInit {
    if (!this.defaultHeaders && !init?.headers) return init ?? {};
    const headers = new Headers(this.defaultHeaders ?? {});
    if (init?.headers) {
      const extra = new Headers(init.headers);
      extra.forEach((value, key) => headers.set(key, value));
    }
    return { ...init, headers };
  }

  private resolveUrl(url: string): string {
    if (!url) return url;
    if (ABSOLUTE_URL.test(url) || !this.baseUrl) {
      return url;
    }
    if (this.isAbsoluteBase) {
      try {
        return new URL(url, this.baseUrl).toString();
      } catch {
        // 絶対URL組み立てに失敗した場合はパス結合へフォールバック
      }
    }
    const base = this.baseUrl;
    // 既にベースと同一／子パスの場合はそのまま返す
    if (url === base || url.startsWith(`${base}/`)) {
      return url;
    }
    const baseWithSlash = base.endsWith("/") ? base.slice(0, -1) : base;
    if (url.startsWith("/")) {
      return `${baseWithSlash}${url}`;
    }
    return `${baseWithSlash}/${url}`;
  }

  private normalizeBase(base: string): string {
    if (!base) return base;
    try {
      let trimmed = base.trim();
      if (!trimmed) return trimmed;
      // 末尾スラッシュを除去し、基底 URL を固定する
      trimmed = trimmed.replace(/\/$/, "");
      if (!ABSOLUTE_URL.test(trimmed) && !trimmed.startsWith("/")) {
        trimmed = `/${trimmed}`;
      }
      return trimmed;
    } catch {
      return base;
    }
  }

  private buildError(response: Response, body: unknown): ApiClientError {
    const messageSource = typeof body === "object" && body !== null ? (body as any).error : null;
    const err = new Error(String(messageSource ?? `HTTP ${response.status}`)) as ApiClientError;
    err.status = response.status;
    err.body = body;
    return err;
  }
}

const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const browserUnauthorizedHandler = (res: Response) => {
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
  return res;
};

export const defaultApiClient = new ApiClient({
  baseUrl: DEFAULT_BASE_URL || undefined,
  onUnauthorized: browserUnauthorizedHandler,
});

export function createApiFetchJson(client: ApiClient) {
  return <T = any>(url: string, init?: RequestInit) => client.json<T>(url, init);
}

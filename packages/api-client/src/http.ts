// モバイル・Web 共通の薄い API クライアント実装
// - Bearer トークン付与や JSON ボディ整形を最小限で肩代わりする

export type TokenProvider = () => string | null | Promise<string | null>;

export type MobileApiClientOptions = {
  baseUrl?: string;
  getAccessToken?: TokenProvider;
  fetchImpl?: typeof fetch;
  defaultHeaders?: HeadersInit;
};

export type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: HeadersInit;
  signal?: AbortSignal;
  okStatuses?: number[];
  parseJson?: boolean;
};

export type ApiClientError = Error & {
  status: number;
  body?: unknown;
};

const ABSOLUTE_URL = /^https?:\/\//i;

/**
 * モバイル BFF を対象とした汎用クライアント
 */
export class MobileApiClient {
  private readonly baseUrl: string | null;
  private readonly isAbsoluteBase: boolean;
  private readonly tokenProvider?: TokenProvider;
  private readonly fetchImpl: typeof fetch;
  private readonly defaultHeaders?: HeadersInit;

  constructor(options: MobileApiClientOptions = {}) {
    const normalized = options.baseUrl ? this.normalizeBase(options.baseUrl) : null;
    this.baseUrl = normalized;
    this.isAbsoluteBase = normalized ? ABSOLUTE_URL.test(normalized) : false;
    this.tokenProvider = options.getAccessToken;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.defaultHeaders = options.defaultHeaders;
  }

  /**
   * 任意メソッドでリクエストを送信し、必要に応じて JSON を返す。
   */
  async send<T = unknown>(path: string, options: RequestOptions = {}): Promise<T | Response> {
    const url = this.resolveUrl(path);
    const method = options.method ?? 'GET';
    const headers = this.mergeHeaders(options.headers);

    const token = await this.resolveToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    let body: BodyInit | undefined;
    if (options.body !== undefined && options.body !== null) {
      if (typeof options.body === 'string' || options.body instanceof FormData || options.body instanceof URLSearchParams) {
        body = options.body as BodyInit;
      } else {
        if (!headers.has('Content-Type')) {
          headers.set('Content-Type', 'application/json');
        }
        body = JSON.stringify(options.body);
      }
    }

    const response = await this.fetchImpl(url, {
      method,
      body,
      headers,
      signal: options.signal,
    });

    const okStatuses = options.okStatuses ?? [200];
    if (!okStatuses.includes(response.status)) {
      throw await this.buildError(response);
    }

    if (options.parseJson === false || response.status === 204) {
      return response;
    }

    try {
      return (await response.json()) as T;
    } catch {
      return {} as T;
    }
  }

  /**
   * Push トークン登録 API 向けのヘルパー。
   */
  async registerPushToken(payload: { deviceId: string; platform: 'ios' | 'android'; token: string }): Promise<void> {
    await this.send('/api/v1/push/register', {
      method: 'POST',
      body: payload,
      okStatuses: [204],
      parseJson: false,
    });
  }

  /**
   * ベース URL を正規化する。
   */
  private normalizeBase(base: string): string {
    if (!base) return base;
    const trimmed = base.trim();
    if (!trimmed) return trimmed;
    return trimmed.replace(/\/$/, '');
  }

  private resolveUrl(path: string): string {
    if (!path) return this.baseUrl ?? '';
    if (ABSOLUTE_URL.test(path) || !this.baseUrl) {
      return path;
    }
    if (this.isAbsoluteBase) {
      try {
        return new URL(path, this.baseUrl).toString();
      } catch {
        // URL組み立てに失敗した場合は後続の結合ロジックにフォールバック
      }
    }
    const base = this.baseUrl;
    if (path.startsWith('/')) {
      return `${base}${path}`;
    }
    return `${base}/${path}`;
  }

  private mergeHeaders(extra?: HeadersInit): Headers {
    const headers = new Headers(this.defaultHeaders ?? {});
    if (extra) {
      const additional = new Headers(extra);
      additional.forEach((value, key) => headers.set(key, value));
    }
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }
    return headers;
  }

  private async resolveToken(): Promise<string | null> {
    if (!this.tokenProvider) return null;
    const value = this.tokenProvider();
    return value instanceof Promise ? await value : value;
  }

  private async buildError(response: Response): Promise<ApiClientError> {
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      payload = undefined;
    }
    const message = typeof payload === 'object' && payload !== null && 'message' in (payload as any)
      ? String((payload as any).message)
      : `HTTP ${response.status}`;
    const error = new Error(message) as ApiClientError;
    error.status = response.status;
    error.body = payload;
    return error;
  }
}

/**
 * クライアント生成の簡易ヘルパー。
 */
export function createMobileApiClient(options: MobileApiClientOptions = {}): MobileApiClient {
  return new MobileApiClient(options);
}

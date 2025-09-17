// BFF 共通の認証ユーティリティ
// - Authorization ヘッダの Bearer トークンを検証
// - 必要に応じて Cookie セッションへフォールバック

import { verifyAppJwt, type VerifiedAppJwt, type VerifyAppJwtOptions, type TokenType } from './token';

export type HeadersLike = Headers | Record<string, string | undefined>;

export type SessionSummary = {
  userId: string;
  scopes?: string[];
};

export type SessionResolver = () => Promise<SessionSummary | null>;

export type GetAuthUserOptions = {
  request: Request | { headers: HeadersLike };
  secret?: string;
  requiredScope?: string;
  expectedTokenType?: TokenType;
  allowCookieFallback?: boolean;
  sessionResolver?: SessionResolver;
  allowInsecureDevToken?: boolean;
  devTokenPrefix?: string;
};

export type AuthUser = {
  userId: string;
  scopes: string[];
  source: 'bearer' | 'cookie';
  tokenType: TokenType;
  deviceId?: string;
  rawToken?: VerifiedAppJwt['raw'];
};

export type UnauthorizedCode =
  | 'missing_token'
  | 'invalid_token'
  | 'insufficient_scope'
  | 'missing_session';

export class UnauthorizedError extends Error {
  readonly code: UnauthorizedCode;
  readonly status: number;

  constructor(code: UnauthorizedCode, message: string, status = 401) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/**
 * Bearer トークン優先で認証ユーザーを取得する。
 */
export async function getAuthUser(options: GetAuthUserOptions): Promise<AuthUser> {
  const headers = toHeaders(options.request);
  const authHeader = headers.get('authorization');

  if (authHeader) {
    const bearer = extractBearer(authHeader);
    if (!bearer) {
      throw new UnauthorizedError('invalid_token', 'Authorization header must be Bearer token.');
    }

    const verified = verifyBearerToken(bearer, options);
    if (!verified) {
      throw new UnauthorizedError('invalid_token', 'Bearer token is invalid or expired.');
    }

    ensureScope(verified.scopes, options.requiredScope);

    if (!verified.subject) {
      throw new UnauthorizedError('invalid_token', 'Token subject is missing.');
    }

    return {
      userId: verified.subject,
      scopes: verified.scopes,
      source: 'bearer',
      tokenType: verified.tokenType,
      deviceId: verified.deviceId,
      rawToken: verified.raw,
    };
  }

  if (options.allowCookieFallback !== false && options.sessionResolver) {
    const session = await options.sessionResolver();
    if (!session) {
      throw new UnauthorizedError('missing_session', 'Cookie session not found.');
    }
    if (!session.userId) {
      throw new UnauthorizedError('missing_session', 'Session user id is missing.');
    }
    ensureScope(session.scopes ?? [], options.requiredScope);
    return {
      userId: session.userId,
      scopes: session.scopes ?? [],
      source: 'cookie',
      tokenType: 'unknown',
    };
  }

  throw new UnauthorizedError('missing_token', 'Authorization is required.');
}

function verifyBearerToken(token: string, options: GetAuthUserOptions): VerifiedAppJwt | null {
  const verifyOptions: VerifyAppJwtOptions = {
    secret: options.secret,
    expectedType: options.expectedTokenType ?? 'access',
    allowInsecureDevToken: options.allowInsecureDevToken,
    devTokenPrefix: options.devTokenPrefix,
  };
  return verifyAppJwt(token, verifyOptions);
}

function ensureScope(scopes: string[], required?: string) {
  if (!required) return;
  if (scopes.includes(required)) return;
  throw new UnauthorizedError('insufficient_scope', `Required scope "${required}" is missing.`, 403);
}

function toHeaders(source: GetAuthUserOptions['request']): Headers {
  if (source instanceof Request) {
    return new Headers(source.headers);
  }
  if ('headers' in source) {
    const headersLike = source.headers;
    if (headersLike instanceof Headers) {
      return new Headers(headersLike);
    }
    const headers = new Headers();
    Object.entries(headersLike).forEach(([key, value]) => {
      if (typeof value === 'string') {
        headers.append(key, value);
      }
    });
    return headers;
  }
  return new Headers();
}

function extractBearer(headerValue: string): string | null {
  const value = headerValue.trim();
  if (!value) return null;
  const [scheme, ...rest] = value.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer') return null;
  const token = rest.join(' ').trim();
  return token || null;
}

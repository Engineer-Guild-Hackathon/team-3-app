// AppJWT（モバイル BFF 用）検証ヘルパー
// - HMAC-SHA256 署名を想定
// - 開発用の簡易 dev トークンも許容

import { createHmac, randomBytes, timingSafeEqual, createHash } from 'node:crypto';

export type SignAppJwtOptions = {
  secret: string;
  subject: string;
  scopes: string[];
  tokenType: TokenType;
  issuer?: string;
  audience?: string;
  deviceId?: string;
  expiresInSeconds: number;
  issuedAt?: number;
};

export type IssueAppTokensOptions = {
  secret: string;
  issuer?: string;
  audience?: string;
  userId: string;
  deviceId: string;
  scopes: string[];
  accessTokenTtlSeconds: number;
  refreshTokenTtlSeconds: number;
};

export type IssuedAppTokens = {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
};

export type TokenType = 'access' | 'refresh' | 'unknown';

export type VerifyAppJwtOptions = {
  secret?: string;
  expectedType?: TokenType;
  currentTimestamp?: number;
  allowInsecureDevToken?: boolean;
  devTokenPrefix?: string;
};

export type VerifiedAppJwt = {
  subject: string;
  scopes: string[];
  deviceId?: string;
  tokenType: TokenType;
  expiresAt?: number;
  issuedAt?: number;
  raw: Record<string, unknown>;
};

const DEV_TOKEN_PREFIX_DEFAULT = 'dev:';

function base64UrlEncode(buffer: Buffer) {
  return buffer
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * AppJWT を生成する。
 */
export function signAppJwt(options: SignAppJwtOptions): string {
  const issuedAt = options.issuedAt ?? Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload: Record<string, unknown> = {
    sub: options.subject,
    scope: options.scopes.join(' '),
    iat: issuedAt,
    exp: issuedAt + options.expiresInSeconds,
    token_type: options.tokenType,
  };
  if (options.issuer) payload.iss = options.issuer;
  if (options.audience) payload.aud = options.audience;
  if (options.deviceId) payload.device_id = options.deviceId;

  const headerSegment = base64UrlEncode(Buffer.from(JSON.stringify(header)));
  const payloadSegment = base64UrlEncode(Buffer.from(JSON.stringify(payload)));
  const signingInput = `${headerSegment}.${payloadSegment}`;
  const signature = createHmac('sha256', options.secret).update(signingInput).digest('base64url');
  return `${signingInput}.${signature}`;
}

export function createRefreshTokenValue(length = 48): string {
  return randomBytes(length).toString('base64url');
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('base64');
}

export function issueAppTokens(options: IssueAppTokensOptions): IssuedAppTokens {
  const now = Math.floor(Date.now() / 1000);
  const accessToken = signAppJwt({
    secret: options.secret,
    subject: options.userId,
    scopes: options.scopes,
    tokenType: 'access',
    issuer: options.issuer,
    audience: options.audience,
    deviceId: options.deviceId,
    expiresInSeconds: options.accessTokenTtlSeconds,
    issuedAt: now,
  });
  const refreshToken = createRefreshTokenValue();
  const refreshTokenExpiresAt = new Date(Date.now() + options.refreshTokenTtlSeconds * 1000);
  const accessTokenExpiresAt = new Date(Date.now() + options.accessTokenTtlSeconds * 1000);
  return {
    accessToken,
    accessTokenExpiresAt,
    refreshToken,
    refreshTokenExpiresAt,
  };
}

/**
 * AppJWT を検証し、利用可能なクレームを返す。
 */
export function verifyAppJwt(token: string, options: VerifyAppJwtOptions = {}): VerifiedAppJwt | null {
  if (!token) return null;

  const devResult = parseDevToken(token, options);
  if (devResult) return devResult;

  const segments = token.split('.');
  if (segments.length !== 3) return null;

  const [headerB64, payloadB64, signatureB64] = segments;
  let header: Record<string, unknown>;
  let payload: Record<string, unknown>;
  try {
    header = parseSegment(headerB64);
    payload = parseSegment(payloadB64);
  } catch {
    return null;
  }

  const secret = options.secret;
  if (!secret) {
    return null;
  }

  const expectedSig = createHmac('sha256', secret).update(`${headerB64}.${payloadB64}`).digest('base64url');
  if (!safeEqual(signatureB64, expectedSig)) {
    return null;
  }

  const tokenType = resolveTokenType(header, payload);
  if (options.expectedType && tokenType !== 'unknown' && tokenType !== options.expectedType) {
    return null;
  }

  const now = options.currentTimestamp ?? Math.floor(Date.now() / 1000);
  const exp = Number((payload as any).exp);
  if (!Number.isNaN(exp) && exp > 0 && exp < now) {
    return null;
  }

  const scopes = extractScopes(payload);
  const deviceId = typeof (payload as any).device_id === 'string' ? String((payload as any).device_id) : undefined;
  const issuedAt = typeof (payload as any).iat === 'number' ? Number((payload as any).iat) : undefined;

  return {
    subject: String((payload as any).sub ?? ''),
    scopes,
    deviceId,
    tokenType,
    issuedAt,
    expiresAt: exp ? exp * 1000 : undefined,
    raw: payload,
  };
}

function extractScopes(payload: Record<string, unknown>): string[] {
  const fromScope = standardizeScopes((payload as any).scope);
  const fromScp = standardizeScopes((payload as any).scp);
  return fromScope.length > 0 ? fromScope : fromScp;
}

function standardizeScopes(candidate: unknown): string[] {
  if (!candidate) return [];
  if (Array.isArray(candidate)) {
    return candidate
      .map((value) => (typeof value === 'string' ? value.trim() : ''))
      .filter((value): value is string => Boolean(value));
  }
  if (typeof candidate === 'string') {
    return candidate
      .split(/[\s,]+/)
      .map((value) => value.trim())
      .filter((value): value is string => Boolean(value));
  }
  return [];
}

function resolveTokenType(header: Record<string, unknown>, payload: Record<string, unknown>): TokenType {
  const candidate =
    String((payload as any).token_type ?? (payload as any).typ ?? (header as any).typ ?? '').toLowerCase();
  if (candidate.includes('refresh')) return 'refresh';
  if (candidate.includes('access')) return 'access';
  return 'unknown';
}

function parseSegment(segment: string): Record<string, unknown> {
  const buf = Buffer.from(segment, 'base64url');
  return JSON.parse(buf.toString('utf8'));
}

function safeEqual(actual: string, expected: string): boolean {
  try {
    return timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
  } catch {
    return false;
  }
}

function parseDevToken(token: string, options: VerifyAppJwtOptions): VerifiedAppJwt | null {
  if (!options.allowInsecureDevToken) return null;
  const prefix = options.devTokenPrefix ?? DEV_TOKEN_PREFIX_DEFAULT;
  if (!token.startsWith(prefix)) return null;
  const raw = token.slice(prefix.length);
  if (!raw) return null;
  const [idPart, scopesPart] = raw.split('|', 2);
  const subject = idPart?.trim() || 'dev-user';
  const scopes = scopesPart
    ? scopesPart.split(',').map((value) => value.trim()).filter(Boolean)
    : [];
  return {
    subject,
    scopes,
    deviceId: undefined,
    tokenType: options.expectedType ?? 'access',
    raw: { dev: true },
  };
}

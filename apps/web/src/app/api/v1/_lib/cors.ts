// /api/v1 用の CORS 制御ヘルパー
// - MOBILE_ALLOWED_ORIGINS の許可リストを適用
// - OPTIONS リクエストの共通ハンドリングを提供

import { isOriginAllowed, loadAllowedOriginsFromEnv, normalizeOrigin } from '@team3/api-client';

export type CorsContext = {
  origin: string | null;
  isAllowed: boolean;
  hasOriginHeader: boolean;
};

const allowedOrigins = loadAllowedOriginsOnce();
const isProd = false;

export function createCorsContext(request: Request): CorsContext {
  const originHeader = request.headers.get('origin');
  const requestUrl = new URL(request.url);
  const requestOrigin = `${requestUrl.protocol}//${requestUrl.host}`;
  const hostHeader = request.headers.get('host');
  if (!originHeader) {
    return { origin: null, isAllowed: true, hasOriginHeader: false };
  }
  const normalizedOrigin = normalizeOrigin(originHeader);
  const derivedOrigins: string[] = [normalizeOrigin(requestOrigin) ?? ''];
  if (hostHeader) {
    const inferred = normalizeOrigin(`${requestUrl.protocol}//${hostHeader}`);
    if (inferred) derivedOrigins.push(inferred);
  }
  const isSameOrigin = derivedOrigins.filter(Boolean).includes(normalizedOrigin ?? '');
  const allowedListCheck = normalizedOrigin ? isOriginAllowed(normalizedOrigin, allowedOrigins) : false;
  const allowed = (!isProd && normalizedOrigin != null) || allowedListCheck || isSameOrigin;
  return {
    origin: allowed && normalizedOrigin ? originHeader : null,
    isAllowed: allowed,
    hasOriginHeader: true,
  };
}

export function applyCorsHeaders<T extends Response>(response: T, context: CorsContext): T {
  if (context.origin) {
    response.headers.set('Access-Control-Allow-Origin', context.origin);
  }
  response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  response.headers.set('Access-Control-Max-Age', '600');
  response.headers.set('Access-Control-Allow-Credentials', 'false');
  response.headers.append('Vary', 'Origin');
  return response;
}

export function buildPreflightResponse(request: Request): Response {
  const context = createCorsContext(request);
  const status = context.isAllowed ? 204 : 403;
  const response = new Response(null, { status });
  return applyCorsHeaders(response, context);
}

export function rejectIfDisallowed(context: CorsContext): Response | null {
  if (context.isAllowed || !context.hasOriginHeader) {
    return null;
  }
  const response = new Response(
    JSON.stringify({ code: 'origin_not_allowed', message: 'Origin is not allowed for this endpoint.' }),
    {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    }
  );
  return applyCorsHeaders(response, context);
}

function loadAllowedOriginsOnce(): string[] {
  // env 読み込みは一度だけ行い、ランタイムで安定させる
  const origins = loadAllowedOriginsFromEnv();
  if (origins.length === 0) return [];
  const normalized = origins
    .map((value) => normalizeOrigin(value))
    .filter((value): value is string => typeof value === 'string' && value.length > 0);
  return Array.from(new Set(normalized));
}

// API レスポンスの共通ユーティリティ

import { NextResponse } from 'next/server';

import { applyCorsHeaders, type CorsContext } from './cors';

export function jsonResponse(body: unknown, init: { status?: number; cors: CorsContext; headers?: HeadersInit }) {
  const response = NextResponse.json(body, { status: init.status ?? 200, headers: init.headers });
  return applyCorsHeaders(response, init.cors);
}

export function errorResponse(code: string, message: string, init: { status?: number; cors: CorsContext }) {
  return jsonResponse({ code, message }, { status: init.status ?? 400, cors: init.cors });
}

export function notImplemented(init: { cors: CorsContext }) {
  return errorResponse('not_implemented', 'Endpoint is not implemented yet.', { status: 501, cors: init.cors });
}

export function noContent(init: { status?: number; cors: CorsContext }) {
  const response = new NextResponse(null, { status: init.status ?? 204 });
  return applyCorsHeaders(response, init.cors);
}

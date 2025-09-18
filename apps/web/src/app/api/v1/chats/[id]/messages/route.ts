import { asc, and, eq, isNull } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

import { authorize } from '../../../_lib/auth';
import { createCorsContext, buildPreflightResponse, rejectIfDisallowed } from '../../../_lib/cors';
import { errorResponse, jsonResponse } from '../../../_lib/responses';
import { getLogger } from '@/lib/logger';
import { db } from '@/db/client';
import { chats, messages } from '@/db/schema';

const log = getLogger('api:v1:chat:messages');

type RouteParams = Record<string, string | string[] | undefined>;
type RouteContext = {
  // Next.js 15 の Route ハンドラが期待する context 形状に合わせる
  params: Promise<RouteParams>;
};

export function OPTIONS(request: Request) {
  return buildPreflightResponse(request);
}

export async function GET(request: NextRequest, context: RouteContext) {
  const cors = createCorsContext(request);
  const rejection = rejectIfDisallowed(cors);
  if (rejection) return rejection;

  const result = await authorize(request, cors, { requiredScope: 'chat:rw' });
  if (result.type === 'error') {
    return result.response;
  }

  const params = await context.params;
  const rawChatId = params?.id;
  const chatId = Array.isArray(rawChatId) ? rawChatId[0]?.trim() : rawChatId?.trim();
  if (!chatId) {
    return errorResponse('invalid_request', 'Chat ID is required.', { status: 400, cors });
  }

  const limit = clampLimit(new URL(request.url).searchParams.get('limit'));
  const dbClient = db;
  if (!dbClient) {
    return errorResponse('service_unavailable', 'Database is not available.', { status: 503, cors });
  }

  const ownedChat = await dbClient
    .select({ id: chats.id })
    .from(chats)
    .where(and(eq(chats.id, chatId), eq(chats.userId, result.user.userId), isNull(chats.deletedAt)))
    .limit(1);
  if (!ownedChat[0]) {
    return errorResponse('not_found', 'Chat not found.', { status: 404, cors });
  }

  try {
    const rows = await dbClient
      .select({
        id: messages.id,
        role: messages.role,
        content: messages.content,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(asc(messages.createdAt), asc(messages.id))
      .limit(limit);

    const items = rows.map((row) => ({
      id: row.id,
      role: row.role,
      content: row.content,
      createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : new Date(row.createdAt as any).toISOString(),
    }));

    log.info({ msg: 'messages:list', chatId, count: items.length, limit });
    return jsonResponse({ items }, { cors });
  } catch (error) {
    log.error({ msg: 'messages:error', chatId, err: error instanceof Error ? error.message : String(error) });
    return errorResponse('internal_error', 'Failed to load messages.', { status: 500, cors });
  }
}

function clampLimit(raw: string | null): number {
  const DEFAULT_LIMIT = 100;
  const MAX_LIMIT = 1000;
  if (!raw) return DEFAULT_LIMIT;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_LIMIT;
  return Math.min(Math.trunc(value), MAX_LIMIT);
}

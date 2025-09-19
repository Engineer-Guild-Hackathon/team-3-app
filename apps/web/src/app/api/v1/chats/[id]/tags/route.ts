import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

import { authorize } from '../../../_lib/auth';
import { buildPreflightResponse, createCorsContext, rejectIfDisallowed } from '../../../_lib/cors';
import { errorResponse, jsonResponse, noContent } from '../../../_lib/responses';
import { db } from '@/db/client';
import { chatTags, tags } from '@/db/schema';
import { getLogger } from '@/lib/logger';

const log = getLogger('api:v1:chats:tags');

type RouteParams = Record<string, string | string[] | undefined>;
type RouteContext = { params: Promise<RouteParams> };

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

  if (!db) {
    return errorResponse('service_unavailable', 'Database is not available.', { status: 503, cors });
  }

  const params = await context.params;
  const rawChatId = params?.id;
  const chatId = Array.isArray(rawChatId) ? rawChatId[0]?.trim() : rawChatId?.trim?.() ?? rawChatId;
  if (!chatId) {
    return errorResponse('invalid_request', 'Chat ID is required.', { status: 400, cors });
  }

  try {
    const items = await db
      .select({
        tagId: chatTags.tagId,
        assignedBy: chatTags.assignedBy,
        confidence: chatTags.confidence,
        createdAt: chatTags.createdAt,
        name: tags.name,
        tagTypeId: tags.tagTypeId,
      })
      .from(chatTags)
      .leftJoin(tags, eq(tags.id, chatTags.tagId))
      .where(eq(chatTags.chatId, chatId));

    return jsonResponse({ items }, { cors });
  } catch (error) {
    log.error({ msg: 'chat_tags:list_failed', chatId, err: error instanceof Error ? error.message : String(error) });
    return errorResponse('internal_error', 'Failed to load chat tags.', { status: 500, cors });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const cors = createCorsContext(request);
  const rejection = rejectIfDisallowed(cors);
  if (rejection) return rejection;

  const result = await authorize(request, cors, { requiredScope: 'chat:rw' });
  if (result.type === 'error') {
    return result.response;
  }

  if (!db) {
    return errorResponse('service_unavailable', 'Database is not available.', { status: 503, cors });
  }

  const params = await context.params;
  const rawChatId = params?.id;
  const chatId = Array.isArray(rawChatId) ? rawChatId[0]?.trim() : rawChatId?.trim?.() ?? rawChatId;
  if (!chatId) {
    return errorResponse('invalid_request', 'Chat ID is required.', { status: 400, cors });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse('invalid_request', 'Request body must be JSON.', { status: 400, cors });
  }

  const tagId = typeof body?.tagId === 'string' ? body.tagId.trim() : '';
  if (!tagId) {
    return errorResponse('invalid_request', 'tagId is required.', { status: 400, cors });
  }

  const assignedBy = typeof body?.assignedBy === 'string' ? body.assignedBy.trim() : 'ai';
  if (!['ai', 'user', 'system'].includes(assignedBy)) {
    return errorResponse('invalid_request', 'assignedBy must be ai, user, or system.', { status: 400, cors });
  }

  const confidence = normalizeConfidence(body?.confidence);

  try {
    await db
      .insert(chatTags)
      .values({
        chatId,
        tagId,
        assignedBy: assignedBy as 'ai' | 'user' | 'system',
        confidence,
      })
      .onConflictDoUpdate({
        target: [chatTags.chatId, chatTags.tagId],
        set: {
          assignedBy: assignedBy as 'ai' | 'user' | 'system',
          confidence,
        },
      });

    return noContent({ cors });
  } catch (error) {
    log.error({
      msg: 'chat_tags:upsert_failed',
      chatId,
      tagId,
      err: error instanceof Error ? error.message : String(error),
    });
    return errorResponse('internal_error', 'Failed to attach tag.', { status: 500, cors });
  }
}

function normalizeConfidence(value: unknown): number {
  if (typeof value !== 'number') return 0;
  if (!Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

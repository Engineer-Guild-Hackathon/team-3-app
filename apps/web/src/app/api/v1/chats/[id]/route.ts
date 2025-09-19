import type { NextRequest } from 'next/server';
import { authorize } from '../../_lib/auth';
import { createCorsContext, buildPreflightResponse, rejectIfDisallowed } from '../../_lib/cors';
import { errorResponse, noContent } from '../../_lib/responses';
import { db } from '@/db/client';
import { chats } from '@/db/schema';
import { and, eq, isNull, sql } from 'drizzle-orm';

export function OPTIONS(request: Request) {
  return buildPreflightResponse(request);
}

type RouteParams = Record<string, string | string[] | undefined>;

const patchHandler = async (request: NextRequest, context: { params: Promise<RouteParams> }) => {
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

  const resolvedParams = await context.params;
  const rawId = resolvedParams?.id;
  const chatId = Array.isArray(rawId) ? rawId[0]?.trim() : rawId?.trim?.() ?? rawId;
  if (!chatId) {
    return errorResponse('invalid_request', 'Chat ID is required.', { status: 400, cors });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse('invalid_request', 'Request body must be JSON.', { status: 400, cors });
  }

  const updates: Record<string, unknown> = {};
  if (typeof body?.title === 'string') {
    const trimmed = body.title.trim();
    if (trimmed.length === 0) {
      return errorResponse('invalid_request', 'title must not be empty.', { status: 400, cors });
    }
    updates.title = trimmed;
  }
  if (typeof body?.status === 'string') {
    if (body.status !== 'in_progress' && body.status !== 'ended') {
      return errorResponse('invalid_request', 'status must be in_progress or ended.', { status: 400, cors });
    }
    updates.status = body.status;
  }
  if ('subjectId' in body) {
    updates.subjectId = typeof body.subjectId === 'string' && body.subjectId.trim() ? body.subjectId.trim() : null;
  }
  if ('topicId' in body) {
    updates.topicId = typeof body.topicId === 'string' && body.topicId.trim() ? body.topicId.trim() : null;
  }

  if (Object.keys(updates).length === 0) {
    return errorResponse('invalid_request', 'No updatable fields provided.', { status: 400, cors });
  }

  updates.updatedAt = sql`now()`;

  try {
    const updated = await db
      .update(chats)
      .set(updates)
      .where(and(eq(chats.id, chatId), eq(chats.userId, result.user.userId), isNull(chats.deletedAt)))
      .returning({ id: chats.id });

    if (updated.length === 0) {
      return errorResponse('not_found', 'Chat not found.', { status: 404, cors });
    }

    return noContent({ cors });
  } catch (error) {
    return handleUnexpected(error, cors);
  }
};

const deleteHandler = async (request: NextRequest, context: { params: Promise<RouteParams> }) => {
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

  const resolvedParams = await context.params;
  const rawId = resolvedParams?.id;
  const chatId = Array.isArray(rawId) ? rawId[0]?.trim() : rawId?.trim?.() ?? rawId;
  if (!chatId) {
    return errorResponse('invalid_request', 'Chat ID is required.', { status: 400, cors });
  }

  try {
    const updated = await db
      .update(chats)
      .set({ deletedAt: sql`now()`, updatedAt: sql`now()` })
      .where(and(eq(chats.id, chatId), eq(chats.userId, result.user.userId), isNull(chats.deletedAt)))
      .returning({ id: chats.id });

    if (updated.length === 0) {
      return errorResponse('not_found', 'Chat not found.', { status: 404, cors });
    }

    return noContent({ cors });
  } catch (error) {
    return handleUnexpected(error, cors);
  }
};

export const PATCH: any = patchHandler;
export const DELETE: any = deleteHandler;

function handleUnexpected(error: unknown, cors: ReturnType<typeof createCorsContext>) {
  const message = error instanceof Error ? error.message : String(error);
  return errorResponse('internal_error', message, { status: 500, cors });
}

import { authorize } from '../_lib/auth';
import { createCorsContext, buildPreflightResponse, rejectIfDisallowed } from '../_lib/cors';
import { errorResponse, jsonResponse } from '../_lib/responses';
import { db } from '@/db/client';
import { chats } from '@/db/schema';
import { and, desc, eq, isNull } from 'drizzle-orm';

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;

export function OPTIONS(request: Request) {
  return buildPreflightResponse(request);
}

export async function GET(request: Request) {
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

  const userId = result.user.userId;
  const url = new URL(request.url);
  const limit = clampLimit(url.searchParams.get('limit'));

  try {
    const rows = await db
      .select({
        id: chats.id,
        title: chats.title,
        status: chats.status,
        subjectId: chats.subjectId,
        topicId: chats.topicId,
        updatedAt: chats.updatedAt,
        createdAt: chats.createdAt,
      })
      .from(chats)
      .where(and(eq(chats.userId, userId), isNull(chats.deletedAt)))
      .orderBy(desc(chats.updatedAt), desc(chats.id))
      .limit(limit);

    return jsonResponse(
      {
        items: rows,
        nextCursor: null,
      },
      { cors }
    );
  } catch (error) {
    return handleUnexpected(error, cors);
  }
}

export async function POST(request: Request) {
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

  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse('invalid_request', 'Request body must be JSON.', { status: 400, cors });
  }

  const title = typeof body?.title === 'string' && body.title.trim().length > 0 ? body.title.trim() : '新しいチャット';
  const subjectId = typeof body?.subjectId === 'string' && body.subjectId.trim() !== '' ? body.subjectId.trim() : null;
  const topicId = typeof body?.topicId === 'string' && body.topicId.trim() !== '' ? body.topicId.trim() : null;

  try {
    const inserted = await db
      .insert(chats)
      .values({
        userId: result.user.userId,
        title,
        subjectId,
        topicId,
        status: 'in_progress',
      })
      .returning({
        id: chats.id,
        title: chats.title,
        status: chats.status,
        subjectId: chats.subjectId,
        topicId: chats.topicId,
        createdAt: chats.createdAt,
        updatedAt: chats.updatedAt,
      });

    const row = inserted[0];
    if (!row) {
      return errorResponse('insert_failed', 'Failed to create chat.', { status: 500, cors });
    }

    return jsonResponse(row, { status: 201, cors });
  } catch (error) {
    return handleUnexpected(error, cors);
  }
}

function clampLimit(limitRaw: string | null) {
  if (!limitRaw) return DEFAULT_LIMIT;
  const value = Number(limitRaw);
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_LIMIT;
  return Math.min(Math.trunc(value), MAX_LIMIT);
}

function handleUnexpected(error: unknown, cors: ReturnType<typeof createCorsContext>) {
  const message = error instanceof Error ? error.message : String(error);
  return errorResponse('internal_error', message, { status: 500, cors });
}

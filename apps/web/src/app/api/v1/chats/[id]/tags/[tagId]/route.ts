import { and, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

import { authorize } from '../../../../_lib/auth';
import { buildPreflightResponse, createCorsContext, rejectIfDisallowed } from '../../../../_lib/cors';
import { errorResponse, noContent } from '../../../../_lib/responses';
import { db } from '@/db/client';
import { chatTags } from '@/db/schema';
import { getLogger } from '@/lib/logger';

const log = getLogger('api:v1:chats:tags:delete');

type RouteParams = Record<string, string | string[] | undefined>;
type RouteContext = { params: Promise<RouteParams> };

export function OPTIONS(request: Request) {
  return buildPreflightResponse(request);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
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
  const rawTagId = params?.tagId;
  const chatId = Array.isArray(rawChatId) ? rawChatId[0]?.trim() : rawChatId?.trim?.() ?? rawChatId;
  const tagId = Array.isArray(rawTagId) ? rawTagId[0]?.trim() : rawTagId?.trim?.() ?? rawTagId;

  if (!chatId || !tagId) {
    return errorResponse('invalid_request', 'chatId and tagId are required.', { status: 400, cors });
  }

  try {
    await db
      .delete(chatTags)
      .where(and(eq(chatTags.chatId, chatId), eq(chatTags.tagId, tagId)));
    return noContent({ cors });
  } catch (error) {
    log.error({
      msg: 'chat_tags:delete_failed',
      chatId,
      tagId,
      err: error instanceof Error ? error.message : String(error),
    });
    return errorResponse('internal_error', 'Failed to remove tag.', { status: 500, cors });
  }
}

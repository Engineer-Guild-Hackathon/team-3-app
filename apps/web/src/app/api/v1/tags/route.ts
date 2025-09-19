import { and, asc, eq } from 'drizzle-orm';

import { authorize } from '../_lib/auth';
import { buildPreflightResponse, createCorsContext, rejectIfDisallowed } from '../_lib/cors';
import { errorResponse, jsonResponse } from '../_lib/responses';
import { db } from '@/db/client';
import { tags } from '@/db/schema';
import { getLogger } from '@/lib/logger';

const log = getLogger('api:v1:tags');

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

  const url = new URL(request.url);
  const subjectId = parseUuid(url.searchParams.get('subjectId'));
  const topicId = parseUuid(url.searchParams.get('topicId'));
  const tagTypeId = parseIntOpt(url.searchParams.get('tagTypeId'));

  if (topicId && !subjectId) {
    return errorResponse('invalid_request', 'topicId requires subjectId.', { status: 400, cors });
  }

  try {
    const conditions = [] as any[];
    if (subjectId) {
      conditions.push(eq(tags.subjectId, subjectId));
    }
    if (topicId) {
      conditions.push(eq(tags.topicId, topicId));
    }
    if (tagTypeId != null) {
      conditions.push(eq(tags.tagTypeId, tagTypeId));
    }

    const whereExpression =
      conditions.length === 0
        ? null
        : conditions.length === 1
          ? conditions[0]
          : and(...conditions);

    const baseQuery = db
      .select({
        id: tags.id,
        name: tags.name,
        description: tags.description,
        subjectId: tags.subjectId,
        topicId: tags.topicId,
        tagTypeId: tags.tagTypeId,
      })
      .from(tags);

    const filteredQuery = whereExpression ? baseQuery.where(whereExpression) : baseQuery;

    const items = await filteredQuery.orderBy(asc(tags.name));
    return jsonResponse({ items }, { cors });
  } catch (error) {
    log.error({ msg: 'tags:list_failed', err: error instanceof Error ? error.message : String(error) });
    return errorResponse('internal_error', 'Failed to load tags.', { status: 500, cors });
  }
}

function parseUuid(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed;
}

function parseIntOpt(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

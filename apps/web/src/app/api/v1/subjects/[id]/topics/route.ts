import { asc, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

import { authorize } from '../../../_lib/auth';
import { buildPreflightResponse, createCorsContext, rejectIfDisallowed } from '../../../_lib/cors';
import { errorResponse, jsonResponse } from '../../../_lib/responses';
import { db } from '@/db/client';
import { topics } from '@/db/schema';
import { getLogger } from '@/lib/logger';

type RouteParams = Record<string, string | string[] | undefined>;
type RouteContext = { params: Promise<RouteParams> };

const log = getLogger('api:v1:subjects:topics');

export function OPTIONS(request: Request) {
  return buildPreflightResponse(request);
}

export async function GET(request: NextRequest, context: RouteContext) {
  const cors = createCorsContext(request);
  const rejection = rejectIfDisallowed(cors);
  if (rejection) return rejection;

  const result = await authorize(request, cors, { requiredScope: 'profile:read' });
  if (result.type === 'error') {
    return result.response;
  }

  if (!db) {
    return errorResponse('service_unavailable', 'Database is not available.', { status: 503, cors });
  }

  const params = await context.params;
  const rawSubjectId = params?.id;
  const subjectId = Array.isArray(rawSubjectId) ? rawSubjectId[0]?.trim() : rawSubjectId?.trim?.() ?? rawSubjectId;

  if (!subjectId) {
    return errorResponse('invalid_request', 'Subject ID is required.', { status: 400, cors });
  }

  try {
    const items = await db
      .select({ id: topics.id, name: topics.name })
      .from(topics)
      .where(eq(topics.subjectId, subjectId))
      .orderBy(asc(topics.name));

    return jsonResponse({ items }, { cors });
  } catch (error) {
    log.error({
      msg: 'topics:list_failed',
      subjectId,
      err: error instanceof Error ? error.message : String(error),
    });
    return errorResponse('internal_error', 'Failed to load topics.', { status: 500, cors });
  }
}

import { asc } from 'drizzle-orm';

import { authorize } from '../_lib/auth';
import { buildPreflightResponse, createCorsContext, rejectIfDisallowed } from '../_lib/cors';
import { errorResponse, jsonResponse } from '../_lib/responses';
import { db } from '@/db/client';
import { tagTypes } from '@/db/schema';
import { getLogger } from '@/lib/logger';

const log = getLogger('api:v1:tag-types');

export function OPTIONS(request: Request) {
  return buildPreflightResponse(request);
}

export async function GET(request: Request) {
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

  try {
    const items = await db
      .select({
        id: tagTypes.id,
        code: tagTypes.code,
        label: tagTypes.label,
      })
      .from(tagTypes)
      .orderBy(asc(tagTypes.id));

    return jsonResponse({ items }, { cors });
  } catch (error) {
    log.error({ msg: 'tag_types:list_failed', err: error instanceof Error ? error.message : String(error) });
    return errorResponse('internal_error', 'Failed to load tag types.', { status: 500, cors });
  }
}

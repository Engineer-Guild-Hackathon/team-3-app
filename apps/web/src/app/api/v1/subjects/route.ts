import { asc } from 'drizzle-orm';

import { authorize } from '../_lib/auth';
import { buildPreflightResponse, createCorsContext, rejectIfDisallowed } from '../_lib/cors';
import { errorResponse, jsonResponse } from '../_lib/responses';
import { db } from '@/db/client';
import { subjects } from '@/db/schema';

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
      .select({ id: subjects.id, name: subjects.name })
      .from(subjects)
      .orderBy(asc(subjects.name));
    return jsonResponse({ items }, { cors });
  } catch (error) {
    return errorResponse('internal_error', error instanceof Error ? error.message : 'Failed to load subjects.', { status: 500, cors });
  }
}

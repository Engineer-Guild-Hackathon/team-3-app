import { authorize } from '../../../_lib/auth';
import { buildPreflightResponse, createCorsContext, rejectIfDisallowed } from '../../../_lib/cors';
import { errorResponse, jsonResponse } from '../../../_lib/responses';
import { db } from '@/db/client';
import { userTagMastery } from '@/db/schema';
import { getLogger } from '@/lib/logger';
import type { NextRequest } from 'next/server';

type RouteParams = Record<string, string | string[] | undefined>;
type RouteContext = { params: Promise<RouteParams> };

const log = getLogger('api:v1:tags:mastery');

export function OPTIONS(request: Request) {
  return buildPreflightResponse(request);
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
  const rawTagId = params?.id;
  const tagId = Array.isArray(rawTagId) ? rawTagId[0]?.trim() : rawTagId?.trim?.() ?? rawTagId;
  if (!tagId) {
    return errorResponse('invalid_request', 'Tag ID is required.', { status: 400, cors });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse('invalid_request', 'Request body must be JSON.', { status: 400, cors });
  }

  const masteryScore = normalizeScore(body?.masteryScore);
  const assessedAt = typeof body?.assessedAt === 'string' ? body.assessedAt : null;

  const timestamp = assessedAt ? new Date(assessedAt) : new Date();

  try {
    const [row] = await db
      .insert(userTagMastery)
      .values({
        userId: result.user.userId,
        tagId,
        masteryScore,
        lastAssessedAt: timestamp,
      })
      .onConflictDoUpdate({
        target: [userTagMastery.userId, userTagMastery.tagId],
        set: {
          masteryScore,
          lastAssessedAt: timestamp,
          updatedAt: new Date(),
        },
      })
      .returning({
        tagId: userTagMastery.tagId,
        masteryScore: userTagMastery.masteryScore,
        lastAssessedAt: userTagMastery.lastAssessedAt,
      });

    return jsonResponse(row, { cors });
  } catch (error) {
    log.error({
      msg: 'tag_mastery:update_failed',
      userId: result.user.userId,
      tagId,
      err: error instanceof Error ? error.message : String(error),
    });
    return errorResponse('internal_error', 'Failed to update tag mastery.', { status: 500, cors });
  }
}

function normalizeScore(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

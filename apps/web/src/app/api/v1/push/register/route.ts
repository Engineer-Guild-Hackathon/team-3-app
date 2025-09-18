import { authorize } from '../../_lib/auth';
import { createCorsContext, buildPreflightResponse, rejectIfDisallowed } from '../../_lib/cors';
import { errorResponse, noContent } from '../../_lib/responses';
import { db } from '@/db/client';
import { devices, pushTokens } from '@/db/schema';
import { and, eq, ne, sql } from 'drizzle-orm';
import { getLogger } from '@/lib/logger';

const SUPPORTED_PLATFORMS = new Set(['ios', 'android']);
const log = getLogger('api:v1:push:register');

export function OPTIONS(request: Request) {
  return buildPreflightResponse(request);
}

export async function POST(request: Request) {
  const cors = createCorsContext(request);
  const rejection = rejectIfDisallowed(cors);
  if (rejection) return rejection;

  const result = await authorize(request, cors, { requiredScope: 'push:register', allowCookieFallback: false });
  if (result.type === 'error') {
    return result.response;
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return errorResponse('invalid_request', 'Request body must be JSON.', { status: 400, cors });
  }

  const deviceId = typeof payload?.deviceId === 'string' ? payload.deviceId.trim() : '';
  const platform = typeof payload?.platform === 'string' ? payload.platform.trim() : '';
  const token = typeof payload?.token === 'string' ? payload.token.trim() : '';

  if (!deviceId || !platform || !token) {
    return errorResponse('invalid_request', 'deviceId, platform, token are required.', { status: 422, cors });
  }

  if (!SUPPORTED_PLATFORMS.has(platform)) {
    return errorResponse('invalid_request', 'platform must be ios or android.', { status: 422, cors });
  }

  const isDevToken = Boolean((result.user.rawToken as any)?.dev);

  if (!db) {
    if (isDevToken) {
      log.info({ msg: 'registered(dev_mode)', deviceId, platform });
      return noContent({ cors });
    }
    return errorResponse('service_unavailable', 'Database is not available.', { status: 503, cors });
  }

  const model = typeof payload?.model === 'string' ? payload.model.trim() : null;
  const osVersion = typeof payload?.osVersion === 'string' ? payload.osVersion.trim() : null;

  if (isDevToken) {
    log.info({ msg: 'registered(dev_mode)', deviceId, platform });
    return noContent({ cors });
  }

  await db.transaction(async (tx) => {
    await tx
      .insert(devices)
      .values({
        id: deviceId,
        userId: result.user.userId,
        model,
        osVersion,
        lastSeenAt: sql`now()`,
        updatedAt: sql`now()`,
      })
      .onConflictDoUpdate({
        target: devices.id,
        set: {
          userId: result.user.userId,
          model,
          osVersion,
          lastSeenAt: sql`now()`,
          updatedAt: sql`now()`,
        },
      });

    await tx
      .delete(pushTokens)
      .where(
        and(
          eq(pushTokens.userId, result.user.userId),
          eq(pushTokens.deviceId, deviceId),
          ne(pushTokens.token, token)
        )
      );

    await tx
      .insert(pushTokens)
      .values({
        userId: result.user.userId,
        token,
        platform,
        deviceId,
        createdAt: sql`now()`,
        updatedAt: sql`now()`,
      })
      .onConflictDoUpdate({
        target: pushTokens.token,
        set: {
          platform,
          deviceId,
          updatedAt: sql`now()`,
        },
      });
  });

  log.info({ msg: 'registered', userId: result.user.userId, deviceId, platform });

  return noContent({ cors });
}

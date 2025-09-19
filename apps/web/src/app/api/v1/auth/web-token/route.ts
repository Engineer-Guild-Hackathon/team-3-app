import { getServerSession } from 'next-auth';
import type { NextRequest } from 'next/server';

import { authOptions } from '@/auth';
import { resolveUserIdByEmail } from '@/lib/auth/user';
import { issueTokens } from '@/lib/auth/token-service';
import { revokeTokensForDevice } from '@/lib/auth/refresh-repo';
import { getLogger } from '@/lib/logger';

import { buildPreflightResponse, createCorsContext, rejectIfDisallowed } from '../../_lib/cors';
import { errorResponse, jsonResponse } from '../../_lib/responses';

type BodyPayload = {
  deviceId?: string;
};

const log = getLogger('api:v1:auth:web-token');

export function OPTIONS(request: Request) {
  return buildPreflightResponse(request);
}

export async function POST(request: NextRequest) {
  const cors = createCorsContext(request);
  const rejection = rejectIfDisallowed(cors);
  if (rejection) return rejection;

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return errorResponse('unauthorized', 'Login required.', { status: 401, cors });
  }

  let payload: BodyPayload | null = null;
  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  const rawDeviceId = payload?.deviceId || request.headers.get('x-device-id') || '';
  const deviceId = rawDeviceId.trim();
  if (!deviceId) {
    return errorResponse('invalid_request', 'deviceId is required.', { status: 400, cors });
  }

  const userId = await resolveUserIdByEmail(session.user.email ?? '', session.user.name ?? undefined);
  if (!userId) {
    return errorResponse('user_not_found', 'Failed to resolve user.', { status: 500, cors });
  }

  try {
    await revokeTokensForDevice(userId, deviceId);

    const scopes = ['profile:read', 'chat:rw', 'push:register', 'iap:verify'];
    const tokens = await issueTokens({
      userId,
      deviceId,
      scopes,
      metadata: { source: 'web' },
    });

    const accessExpiresIn = Math.max(0, Math.round((tokens.accessTokenExpiresAt.getTime() - Date.now()) / 1000));

    log.info({ msg: 'web_token_issued', userId, deviceId });

    return jsonResponse(
      {
        accessToken: tokens.accessToken,
        accessTokenExpiresIn: accessExpiresIn,
        refreshToken: tokens.refreshToken,
        refreshTokenExpiresAt: tokens.refreshTokenExpiresAt.toISOString(),
        deviceId,
      },
      { cors }
    );
  } catch (error) {
    log.error({ msg: 'web_token_issue_failed', err: error instanceof Error ? error.message : String(error) });
    return errorResponse('internal_error', 'Failed to issue token.', { status: 500, cors });
  }
}

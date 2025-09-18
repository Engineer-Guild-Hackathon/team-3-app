import { createCorsContext, buildPreflightResponse, rejectIfDisallowed } from '../../_lib/cors';
import { errorResponse, jsonResponse } from '../../_lib/responses';
import { hashRefreshToken } from '@team3/auth-shared';
import { findRefreshToken } from '@/lib/auth/refresh-repo';
import { issueTokens } from '@/lib/auth/token-service';
import { getLogger } from '@/lib/logger';

const log = getLogger('api:v1:auth:refresh');

export function OPTIONS(request: Request) {
  return buildPreflightResponse(request);
}

export async function POST(request: Request) {
  const cors = createCorsContext(request);
  const rejection = rejectIfDisallowed(cors);
  if (rejection) return rejection;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse('invalid_request', 'Request body must be JSON.', { status: 400, cors });
  }

  const refreshToken = typeof body?.refreshToken === 'string' ? body.refreshToken.trim() : '';
  const deviceId = typeof body?.deviceId === 'string' ? body.deviceId.trim() : '';
  if (!refreshToken || !deviceId) {
    return errorResponse('invalid_request', 'refreshToken and deviceId are required.', { status: 400, cors });
  }

  try {
    const hash = hashRefreshToken(refreshToken);
    const stored = await findRefreshToken(hash);
    if (!stored) {
      throw new Error('Refresh token not found.');
    }
    if (stored.deviceId !== deviceId) {
      throw new Error('Refresh token does not match device.');
    }
    if (stored.revokedAt) {
      throw new Error('Refresh token has been revoked.');
    }
    if (stored.expiresAt.getTime() <= Date.now()) {
      throw new Error('Refresh token has expired.');
    }

    const scopes = Array.isArray((stored.metadata as any)?.scopes)
      ? ((stored.metadata as any).scopes as string[])
      : ['profile:read', 'chat:rw', 'push:register', 'iap:verify'];

    const tokens = await issueTokens({
      userId: stored.userId,
      deviceId,
      scopes,
      metadata: { rotatedFrom: stored.id },
      previousRefreshTokenHash: hash,
    });

    log.info({ msg: 'refresh_success', userId: stored.userId, deviceId });

    const accessExpiresIn = Math.max(
      0,
      Math.round((tokens.accessTokenExpiresAt.getTime() - Date.now()) / 1000)
    );

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
    log.warn({ msg: 'refresh_failed', err: error instanceof Error ? error.message : String(error) });
    return errorResponse('invalid_refresh_token', error instanceof Error ? error.message : 'Refresh failed.', {
      status: 401,
      cors,
    });
  }
}

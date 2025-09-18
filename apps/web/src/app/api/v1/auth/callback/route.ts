import { createCorsContext, buildPreflightResponse, rejectIfDisallowed } from '../../_lib/cors';
import { errorResponse, jsonResponse } from '../../_lib/responses';
import { exchangeAuthorizationCode } from '@/lib/auth/oidc';
import { resolveUserIdByEmail } from '@/lib/auth/user';
import { issueTokens } from '@/lib/auth/token-service';
import { revokeTokensForDevice } from '@/lib/auth/refresh-repo';
import { getLogger } from '@/lib/logger';

const log = getLogger('api:v1:auth:callback');
const DEFAULT_SCOPES = ['profile:read', 'chat:rw', 'push:register', 'iap:verify'];

export function OPTIONS(request: Request) {
  return buildPreflightResponse(request);
}

export async function GET(request: Request) {
  const cors = createCorsContext(request);
  const rejection = rejectIfDisallowed(cors);
  if (rejection) return rejection;

  const url = new URL(request.url);
  const code = url.searchParams.get('code')?.trim();
  const deviceId = url.searchParams.get('deviceId')?.trim() ?? request.headers.get('x-device-id')?.trim();
  const state = url.searchParams.get('state') ?? undefined;
  const codeVerifier = url.searchParams.get('code_verifier')?.trim() ?? request.headers.get('x-code-verifier')?.trim();

  if (!code) {
    return errorResponse('invalid_request', 'Missing authorization code.', { status: 400, cors });
  }
  if (!deviceId) {
    return errorResponse('invalid_request', 'deviceId is required.', { status: 400, cors });
  }

  try {
    const oidcUser = await exchangeAuthorizationCode({ code, codeVerifier: codeVerifier ?? undefined });
    const userId = await resolveUserIdByEmail(oidcUser.email, oidcUser.name ?? undefined);
    if (!userId) {
      return errorResponse('user_not_found', 'Failed to resolve user.', { status: 500, cors });
    }

    await revokeTokensForDevice(userId, deviceId);

    const tokens = await issueTokens({
      userId,
      deviceId,
      scopes: DEFAULT_SCOPES,
      metadata: { state },
    });

    log.info({ msg: 'auth_callback_success', userId, deviceId });

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
    log.error({ msg: 'auth_callback_failed', err: error instanceof Error ? error.message : String(error) });
    return errorResponse('auth_failed', error instanceof Error ? error.message : 'Authorization failed.', {
      status: 401,
      cors,
    });
  }
}

import { createCorsContext, buildPreflightResponse, rejectIfDisallowed } from '../../_lib/cors';
import { jsonResponse, errorResponse } from '../../_lib/responses';
import { getOidcConfig } from '@/lib/auth/config';

export function OPTIONS(request: Request) {
  return buildPreflightResponse(request);
}

export async function GET(request: Request) {
  const cors = createCorsContext(request);
  const rejection = rejectIfDisallowed(cors);
  if (rejection) return rejection;
  try {
    const config = getOidcConfig();
    return jsonResponse(
      {
        authorizationEndpoint: config.authorizationEndpoint,
        clientId: config.clientId,
        redirectUri: config.redirectUri,
        scope: config.scope,
        codeChallengeMethod: 'S256',
        devMode: config.devMode,
      },
      { cors }
    );
  } catch (error) {
    return errorResponse('configuration_error', (error as Error).message, { status: 500, cors });
  }
}

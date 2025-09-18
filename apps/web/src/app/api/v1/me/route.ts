import { authorize } from '../_lib/auth';
import { createCorsContext, buildPreflightResponse, rejectIfDisallowed } from '../_lib/cors';
import { jsonResponse } from '../_lib/responses';

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

  const { user } = result;
  const body = {
    id: user.userId,
    scopes: user.scopes,
    authSource: user.source,
    tokenType: user.tokenType,
    deviceId: user.deviceId ?? null,
  };

  return jsonResponse(body, { cors });
}

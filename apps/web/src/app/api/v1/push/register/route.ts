import { authorize } from '../../_lib/auth';
import { createCorsContext, buildPreflightResponse, rejectIfDisallowed } from '../../_lib/cors';
import { errorResponse, noContent } from '../../_lib/responses';

const SUPPORTED_PLATFORMS = new Set(['ios', 'android']);

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

  // TODO: DB 永続化（drizzle で push_tokens / devices を更新）

  return noContent({ cors });
}

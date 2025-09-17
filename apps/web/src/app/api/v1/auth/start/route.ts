import { createCorsContext, buildPreflightResponse, rejectIfDisallowed } from '../../_lib/cors';
import { notImplemented } from '../../_lib/responses';

export function OPTIONS(request: Request) {
  return buildPreflightResponse(request);
}

export async function GET(request: Request) {
  const cors = createCorsContext(request);
  const rejection = rejectIfDisallowed(cors);
  if (rejection) return rejection;
  return notImplemented({ cors });
}

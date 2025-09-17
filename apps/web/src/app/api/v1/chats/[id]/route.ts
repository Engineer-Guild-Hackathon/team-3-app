import { authorize } from '../../_lib/auth';
import { createCorsContext, buildPreflightResponse, rejectIfDisallowed } from '../../_lib/cors';
import { notImplemented } from '../../_lib/responses';

export function OPTIONS(request: Request) {
  return buildPreflightResponse(request);
}

export async function PATCH(request: Request) {
  const cors = createCorsContext(request);
  const rejection = rejectIfDisallowed(cors);
  if (rejection) return rejection;

  const result = await authorize(request, cors, { requiredScope: 'chat:rw' });
  if (result.type === 'error') {
    return result.response;
  }

  return notImplemented({ cors });
}

export async function DELETE(request: Request) {
  const cors = createCorsContext(request);
  const rejection = rejectIfDisallowed(cors);
  if (rejection) return rejection;

  const result = await authorize(request, cors, { requiredScope: 'chat:rw' });
  if (result.type === 'error') {
    return result.response;
  }

  return notImplemented({ cors });
}

import { authorize } from '../_lib/auth';
import { createCorsContext, buildPreflightResponse, rejectIfDisallowed } from '../_lib/cors';
import { jsonResponse } from '../_lib/responses';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

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
  const profile = await fetchUserProfile(user.userId);

  const body = {
    profile: {
      id: user.userId,
      email: profile?.email ?? null,
      displayName: profile?.displayName ?? null,
    },
    auth: {
      scopes: user.scopes,
      source: user.source,
      tokenType: user.tokenType,
      deviceId: user.deviceId ?? null,
    },
  };

  return jsonResponse(body, { cors });
}

async function fetchUserProfile(userId: string) {
  if (!db) return null;
  try {
    const rows = await db
      .select({ id: users.id, email: users.email, displayName: users.displayName })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return rows[0] ?? null;
  } catch (error) {
    // DB エラー時はプロフィール情報なしで返却する
    console.warn('[api:v1:me] failed to load profile', error);
    return null;
  }
}

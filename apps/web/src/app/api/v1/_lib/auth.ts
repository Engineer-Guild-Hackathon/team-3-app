// /api/v1 の認証ヘルパー
// - Bearer トークンを優先し、必要に応じて Cookie セッションへフォールバック

import { getAuthUser, UnauthorizedError, type AuthUser } from '@team3/auth-shared';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/auth';

import { errorResponse } from './responses';
import type { CorsContext } from './cors';

const isProd = process.env.NODE_ENV === 'production';

export type AuthorizeOptions = {
  requiredScope?: string;
  tokenType?: 'access' | 'refresh';
  allowCookieFallback?: boolean;
};

export type AuthorizeResult =
  | { type: 'ok'; user: AuthUser }
  | { type: 'error'; response: Response };

export async function authorize(request: Request, cors: CorsContext, options: AuthorizeOptions = {}): Promise<AuthorizeResult> {
  try {
    const user = await getAuthUser({
      request,
      secret: process.env.BFF_APP_JWT_SECRET,
      requiredScope: options.requiredScope,
      expectedTokenType: options.tokenType ?? 'access',
      allowCookieFallback: options.allowCookieFallback ?? true,
      allowInsecureDevToken: !isProd,
      sessionResolver: async () => {
        const session = await getServerSession(authOptions);
        const id = (session?.user as any)?.id;
        if (!id) return null;
        return {
          userId: String(id),
          scopes: ['profile:read', 'chat:rw', 'push:register', 'iap:verify'],
        };
      },
    });
    return { type: 'ok', user };
  } catch (error: unknown) {
    if (process.env.NODE_ENV !== 'production') {
      const authHeader = request.headers.get('authorization');
      console.warn('[authorize] failed', {
        scope: options.requiredScope,
        hasAuthHeader: Boolean(authHeader),
        authHeader: authHeader ? authHeader.slice(0, 16) + '...' : null,
        err: error instanceof Error ? error.message : String(error),
      });
    }
    if (isUnauthorizedError(error)) {
      return {
        type: 'error',
        response: errorResponse(error.code, error.message, { status: error.status, cors }),
      };
    }
    throw error instanceof Error ? error : new Error(String(error));
  }
}

function isUnauthorizedError(error: unknown): error is UnauthorizedError {
  return error instanceof UnauthorizedError;
}

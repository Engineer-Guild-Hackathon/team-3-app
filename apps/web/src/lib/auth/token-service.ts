import { hashRefreshToken, issueAppTokens } from '@team3/auth-shared';

import { getAppJwtConfig } from './config';
import { persistRefreshToken } from './refresh-repo';

export type IssueTokensParams = {
  userId: string;
  deviceId: string;
  scopes: string[];
  metadata?: Record<string, unknown>;
  previousRefreshTokenHash?: string;
};

export async function issueTokens(params: IssueTokensParams) {
  const config = getAppJwtConfig();
  const tokens = issueAppTokens({
    secret: config.secret,
    issuer: config.issuer,
    audience: config.audience,
    userId: params.userId,
    deviceId: params.deviceId,
    scopes: params.scopes,
    accessTokenTtlSeconds: config.accessTokenTtlSeconds,
    refreshTokenTtlSeconds: config.refreshTokenTtlSeconds,
  });

  const refreshHash = hashRefreshToken(tokens.refreshToken);
  const metadata = { ...(params.metadata ?? {}), scopes: params.scopes };

  await persistRefreshToken({
    userId: params.userId,
    deviceId: params.deviceId,
    refreshTokenHash: refreshHash,
    expiresAt: tokens.refreshTokenExpiresAt,
    metadata,
    previousTokenHash: params.previousRefreshTokenHash,
  });

  return tokens;
}

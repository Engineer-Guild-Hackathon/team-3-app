import { describe, expect, it } from 'vitest';
import {
  signAppJwt,
  verifyAppJwt,
  createRefreshTokenValue,
  hashRefreshToken,
  issueAppTokens,
} from './token';

describe('token utilities', () => {
  const secret = 'test-secret';

  it('signs and verifies AppJWT', () => {
    const jwt = signAppJwt({
      secret,
      subject: 'user-123',
      scopes: ['profile:read', 'chat:rw'],
      tokenType: 'access',
      deviceId: 'device-1',
      expiresInSeconds: 60,
    });

    const verified = verifyAppJwt(jwt, { secret });
    expect(verified).not.toBeNull();
    expect(verified?.subject).toBe('user-123');
    expect(verified?.scopes).toEqual(['profile:read', 'chat:rw']);
    expect(verified?.deviceId).toBe('device-1');
    expect(verified?.tokenType).toBe('access');
  });

  it('issues access/refresh token pair', () => {
    const tokens = issueAppTokens({
      secret,
      userId: 'user-1',
      deviceId: 'device-1',
      scopes: ['profile:read'],
      accessTokenTtlSeconds: 30,
      refreshTokenTtlSeconds: 60,
    });

    expect(tokens.accessToken).toBeTypeOf('string');
    expect(tokens.refreshToken).toBeTypeOf('string');
    expect(tokens.accessTokenExpiresAt.getTime()).toBeGreaterThan(Date.now());
    expect(tokens.refreshTokenExpiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('creates unique refresh tokens and hashes them', () => {
    const token = createRefreshTokenValue();
    const token2 = createRefreshTokenValue();
    expect(token).not.toBe(token2);
    const hash = hashRefreshToken(token);
    const hash2 = hashRefreshToken(token);
    expect(hash).toBe(hash2);
  });
});

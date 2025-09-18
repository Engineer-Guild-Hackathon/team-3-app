import { db } from '@/db/client';
import { refreshTokens } from '@/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { getLogger } from '@/lib/logger';

const log = getLogger('auth:refreshRepo');

export type PersistRefreshTokenParams = {
  userId: string;
  deviceId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  metadata?: Record<string, unknown>;
  previousTokenHash?: string;
};

export type StoredRefreshToken = {
  id: string;
  userId: string;
  deviceId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  metadata: Record<string, unknown> | null;
};

export async function persistRefreshToken(params: PersistRefreshTokenParams): Promise<void> {
  if (!db) {
    log.error('Database client is not initialized');
    throw new Error('Database is not available');
  }

  await db.transaction(async (tx) => {
    if (params.previousTokenHash) {
      await tx
        .update(refreshTokens)
        .set({ rotatedAt: sql`now()`, revokedAt: sql`now()`, updatedAt: sql`now()` })
        .where(eq(refreshTokens.tokenHash, params.previousTokenHash));
    }

    await tx
      .insert(refreshTokens)
      .values({
        userId: params.userId,
        deviceId: params.deviceId,
        tokenHash: params.refreshTokenHash,
        metadata: params.metadata ?? null,
        expiresAt: params.expiresAt,
        updatedAt: sql`now()`,
      })
      .onConflictDoUpdate({
        target: refreshTokens.tokenHash,
        set: {
          userId: params.userId,
          deviceId: params.deviceId,
          metadata: params.metadata ?? null,
          expiresAt: params.expiresAt,
          revokedAt: null,
          rotatedAt: null,
          updatedAt: sql`now()`,
        },
      });
  });
}

export async function findRefreshToken(hash: string): Promise<StoredRefreshToken | null> {
  if (!db) return null;
  const rows = await db
    .select({
      id: refreshTokens.id,
      userId: refreshTokens.userId,
      deviceId: refreshTokens.deviceId,
      tokenHash: refreshTokens.tokenHash,
      expiresAt: refreshTokens.expiresAt,
      revokedAt: refreshTokens.revokedAt,
      metadata: refreshTokens.metadata,
    })
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, hash))
    .limit(1);
  if (!rows[0]) return null;
  const row = rows[0];
  return {
    ...row,
    metadata: (row.metadata ?? null) as Record<string, unknown> | null,
  };
}

export async function revokeTokensForDevice(userId: string, deviceId: string): Promise<void> {
  if (!db) return;
  await db
    .update(refreshTokens)
    .set({ revokedAt: sql`now()`, updatedAt: sql`now()` })
    .where(and(eq(refreshTokens.userId, userId), eq(refreshTokens.deviceId, deviceId)));
}

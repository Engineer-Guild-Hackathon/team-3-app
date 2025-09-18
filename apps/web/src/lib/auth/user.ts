import { db } from '@/db/client';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function resolveUserIdByEmail(email: string, displayName?: string): Promise<string | null> {
  if (!db) return null;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const found = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalized))
    .limit(1);
  if (found.length > 0) return found[0].id as string;

  const inserted = await db
    .insert(users)
    .values({ email: normalized, displayName: displayName?.trim() ?? null })
    .returning({ id: users.id });

  return inserted[0]?.id as string ?? null;
}

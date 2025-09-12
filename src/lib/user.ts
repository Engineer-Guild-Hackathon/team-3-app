// ユーザー解決ヘルパー（セッション → users.id）
// - email を主キーとして upsert 相当の解決を行う
// - 認証済み前提で呼び出す

import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function resolveUserIdFromSession(session: any): Promise<string | null> {
  if (!db) return null;
  const email = String(session?.user?.email ?? "").trim();
  if (!email) return null;
  const displayName = String(session?.user?.name ?? "");

  const found = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (found.length > 0) return found[0].id as string;

  const inserted = await db
    .insert(users)
    .values({ email, displayName })
    .returning({ id: users.id });
  return inserted[0]?.id as string ?? null;
}


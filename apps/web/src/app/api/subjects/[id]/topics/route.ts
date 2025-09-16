import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/db/client";
import { topics } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  if (!db) return NextResponse.json({ ok: false, error: "DB unavailable" }, { status: 503 });
  const { id } = await ctx.params;
  const rows = await db.select({ id: topics.id, name: topics.name }).from(topics).where(eq(topics.subjectId, id)).orderBy(asc(topics.name));
  return NextResponse.json({ ok: true, result: { items: rows } });
}


import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/db/client";
import { subjects } from "@/db/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  if (!db) return NextResponse.json({ ok: false, error: "DB unavailable" }, { status: 503 });
  const rows = await db.select({ id: subjects.id, name: subjects.name }).from(subjects).orderBy(asc(subjects.name));
  return NextResponse.json({ ok: true, result: { items: rows } });
}


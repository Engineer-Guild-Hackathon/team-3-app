import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/db/client";
import { chats, subjects, topics } from "@/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { getLogger } from "@/lib/logger";
import { resolveUserIdFromSession } from "@/lib/user";

// チャット一覧の取得（認証ユーザーのみ）。
// クエリ: ?limit= 数
export async function GET(req: Request) {
  const log = getLogger("api:chats:list");
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      log.warn({ msg: "unauthorized" });
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!db) {
      log.error({ msg: "db_unavailable" });
      return NextResponse.json({ ok: false, error: "DB unavailable" }, { status: 503 });
    }

    // 取得件数（上限ガード）
    const url = new URL(req.url);
    const limitRaw = url.searchParams.get("limit");
    let limit = Number(limitRaw ?? 50);
    if (!Number.isFinite(limit) || limit <= 0) limit = 50;
    if (limit > 200) limit = 200;

    const userId = await resolveUserIdFromSession(session);
    if (!userId) {
      log.error({ msg: "user_resolve_failed" });
      return NextResponse.json({ ok: false, error: "User resolve failed" }, { status: 500 });
    }

    // ユーザーの chats を更新日時降順で取得
    const rows = await db
      .select({
        id: chats.id,
        title: chats.title,
        status: chats.status,
        createdAt: chats.createdAt,
        updatedAt: chats.updatedAt,
        subjectId: chats.subjectId,
        subjectName: subjects.name,
        topicId: chats.topicId,
        topicName: topics.name,
      })
      .from(chats)
      .leftJoin(subjects, eq(chats.subjectId, subjects.id))
      .leftJoin(topics, eq(chats.topicId, topics.id))
      .where(eq(chats.userId, userId))
      .orderBy(desc(chats.updatedAt))
      .limit(limit);

    log.info({ msg: "ok", count: rows.length });
    return NextResponse.json({ ok: true, result: { items: rows } });
  } catch (e: any) {
    const err = String(e?.message ?? e);
    getLogger("api:chats:list").error({ msg: "failed", err });
    return NextResponse.json({ ok: false, error: err }, { status: 500 });
  }
}

// チャット作成（タイトルは任意、未指定は既定値）。
export async function POST(req: Request) {
  const log = getLogger("api:chats:create");
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      log.warn({ msg: "unauthorized" });
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    if (!db) {
      log.error({ msg: "db_unavailable" });
      return NextResponse.json({ ok: false, error: "DB unavailable" }, { status: 503 });
    }

    const userId = await resolveUserIdFromSession(session);
    if (!userId) {
      log.error({ msg: "user_resolve_failed" });
      return NextResponse.json({ ok: false, error: "User resolve failed" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({} as any));
    const titleRaw = typeof body?.title === "string" ? body.title : "";
    const title = titleRaw.trim() || "新しいチャット";
    let subjectId = typeof body?.subjectId === "string" && body.subjectId ? String(body.subjectId) : undefined;
    let topicId = typeof body?.topicId === "string" && body.topicId ? String(body.topicId) : undefined;

    // 既定値の解決（DBから数式: 数学 / 確率）
    if (!subjectId) {
      const s = await db.select({ id: subjects.id }).from(subjects).where(eq(subjects.name, '数学')).limit(1);
      subjectId = s[0]?.id as string | undefined;
    }
    if (!topicId && subjectId) {
      const t = await db.select({ id: topics.id }).from(topics).where(and(eq(topics.subjectId, subjectId), eq(topics.name, '確率'))).limit(1);
      topicId = t[0]?.id as string | undefined;
    }

    const inserted = await db
      .insert(chats)
      .values({ userId, title, subjectId, topicId })
      .returning({ id: chats.id, title: chats.title, createdAt: chats.createdAt, updatedAt: chats.updatedAt, status: chats.status, subjectId: chats.subjectId, topicId: chats.topicId });

    const row = inserted[0];
    log.info({ msg: "created", id: row?.id });
    return NextResponse.json({ ok: true, result: row }, { status: 201 });
  } catch (e: any) {
    const err = String(e?.message ?? e);
    getLogger("api:chats:create").error({ msg: "failed", err });
    return NextResponse.json({ ok: false, error: err }, { status: 500 });
  }
}

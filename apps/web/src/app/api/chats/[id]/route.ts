import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/db/client";
import { chats } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getLogger } from "@/lib/logger";
import { resolveUserIdFromSession } from "@/lib/user";

// チャット更新（タイトル変更のみ）
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const log = getLogger("api:chats:update");
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

    const { id } = await ctx.params;
    const chatId = String(id);
    const body = await req.json().catch(() => ({} as any));
    const titleRaw = typeof body?.title === "string" ? body.title : "";
    const title = titleRaw.trim();
    if (!title) {
      return NextResponse.json({ ok: false, error: "Invalid title" }, { status: 400 });
    }

    const updated = await db
      .update(chats)
      .set({ title })
      .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
      .returning({ id: chats.id, title: chats.title, updatedAt: chats.updatedAt });
    if (updated.length === 0) {
      return NextResponse.json({ ok: false, error: "Not Found" }, { status: 404 });
    }
    log.info({ msg: "updated", id: updated[0].id });
    return NextResponse.json({ ok: true, result: updated[0] });
  } catch (e: any) {
    const err = String(e?.message ?? e);
    getLogger("api:chats:update").error({ msg: "failed", err });
    return NextResponse.json({ ok: false, error: err }, { status: 500 });
  }
}

// チャット削除（カスケードで messages も削除）
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const log = getLogger("api:chats:delete");
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

    const { id } = await ctx.params;
    const chatId = String(id);
    const deleted = await db
      .delete(chats)
      .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
      .returning({ id: chats.id });
    if (deleted.length === 0) {
      return NextResponse.json({ ok: false, error: "Not Found" }, { status: 404 });
    }
    log.info({ msg: "deleted", id: deleted[0].id });
    return NextResponse.json({ ok: true, result: { id: deleted[0].id } });
  } catch (e: any) {
    const err = String(e?.message ?? e);
    getLogger("api:chats:delete").error({ msg: "failed", err });
    return NextResponse.json({ ok: false, error: err }, { status: 500 });
  }
}

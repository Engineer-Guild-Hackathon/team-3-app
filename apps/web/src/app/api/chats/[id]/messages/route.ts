import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/db/client";
import { chats, messages } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { getLogger } from "@/lib/logger";
import { resolveUserIdFromSession } from "@/lib/user";

// 指定チャットのメッセージ履歴を取得（認証 + 所有者チェック）。
// クエリ: ?limit= 数（省略時は全件）
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const log = getLogger("api:chats:messages");
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

    const { id } = await ctx.params;
    const chatId = String(id);

    const userId = await resolveUserIdFromSession(session);
    if (!userId) {
      log.error({ msg: "user_resolve_failed" });
      return NextResponse.json({ ok: false, error: "User resolve failed" }, { status: 500 });
    }

    // 所有者チェック（存在しない/権限なしなら 404）
    const owner = await db
      .select({ id: chats.id })
      .from(chats)
      .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
      .limit(1);
    if (owner.length === 0) {
      log.warn({ msg: "not_found_or_forbidden", chatId });
      return NextResponse.json({ ok: false, error: "Not Found" }, { status: 404 });
    }

    // 取得件数（任意）
    const url = new URL(req.url);
    const limitRaw = url.searchParams.get("limit");
    const limitNum = Number(limitRaw ?? NaN);
    const applyLimit = Number.isFinite(limitNum) && limitNum! > 0 ? Math.min(limitNum!, 1000) : undefined;

    const q = db
      .select({
        id: messages.id,
        role: messages.role,
        content: messages.content,
        createdAt: messages.createdAt,
      })
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(asc(messages.createdAt));
    const rows = applyLimit ? await q.limit(applyLimit) : await q;

    log.info({ msg: "ok", chatId, count: rows.length });
    return NextResponse.json({ ok: true, result: { chatId, items: rows } });
  } catch (e: any) {
    const err = String(e?.message ?? e);
    getLogger("api:chats:messages").error({ msg: "failed", err });
    return NextResponse.json({ ok: false, error: err }, { status: 500 });
  }
}

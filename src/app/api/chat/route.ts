import { NextResponse } from "next/server";
import { runChat } from "@/lib/pipeline";
import { getLogger } from "@/lib/logger";
import { isRunChatInput, isRunChatOutput } from "@/lib/schemas";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { db } from "@/db/client";
import { chats, messages } from "@/db/schema";
import { and, eq, sql, desc } from "drizzle-orm";
import { resolveUserIdFromSession } from "@/lib/user";

// App Router の Route Handlers 仕様（GET/POST など）に従う
// 参考: nextjs docs route handlers :contentReference[oaicite:6]{index=6}

export async function POST(req: Request) {
  try {
    const reqId = (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));
    const log = getLogger("api:chat").child({ reqId });
    const body = await req.json().catch(() => ({}));

    if (!isRunChatInput(body)) {
      log.warn({ msg: "invalid_input", bodyKeys: Object.keys(body ?? {}) });
      return NextResponse.json({ ok: false, error: "Invalid RunChatInput" }, { status: 400 });
    }

    // 認証チェック（未ログインは 401）
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      log.warn({ msg: "unauthorized" });
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const canUseDb = !!db;
    if (!canUseDb) {
      log.warn({ msg: "db_unavailable" });
    }

    // users.id 解決（必要に応じて upsert）
    let userId: string | null = null;
    if (canUseDb) {
      try {
        userId = await resolveUserIdFromSession(session);
      } catch (e: any) {
        log.error({ msg: "user_upsert_failed", err: String(e?.message ?? e) });
      }
    }

    // ended チャットのブロック（DBにチャットが存在し、status=ended の場合）
    if (canUseDb && userId && body.clientSessionId) {
      try {
        const st = await db!
          .select({ status: chats.status })
          .from(chats)
          .where(and(eq(chats.id, String(body.clientSessionId)), eq(chats.userId, userId)))
          .limit(1);
        if (st[0]?.status === 'ended') {
          log.warn({ msg: 'chat_already_ended', chatId: String(body.clientSessionId) });
          return NextResponse.json({ ok: false, error: 'Chat already ended' }, { status: 409 });
        }
      } catch {}
    }

    const sessionId = `chat:${body.chatId}`;
    log.info({ msg: "request(runChat)", chatId: body.chatId, sessionId, turns: body.history?.length ?? 0 });
    const out = await runChat(body, { sessionId, requestId: reqId });

    // DB へ保存（clientSessionId があれば）
    if (canUseDb && userId && body.clientSessionId) {
      const chatUuid = String(body.clientSessionId);
      try {
        // チャットの存在確認/作成
        const existing = await db!
          .select({ id: chats.id })
          .from(chats)
          .where(and(eq(chats.id, chatUuid), eq(chats.userId, userId)))
          .limit(1);
        if (existing.length === 0) {
          await db!
            .insert(chats)
            .values({ id: chatUuid, userId, title: body.subject, status: 'in_progress' });
        }

        // 最終ユーザーメッセージ（存在時）
        const lastTurn = Array.isArray(body.history) && body.history.length > 0 ? body.history[body.history.length - 1] : null;
        const lastUser = lastTurn && typeof lastTurn.user === 'string' ? lastTurn.user.trim() : '';
        if (lastUser) {
          // 直近の user メッセージと重複する場合は挿入をスキップ（簡易重複防止）
          const last = await db!
            .select({ content: messages.content })
            .from(messages)
            .where(and(eq(messages.chatId, chatUuid), eq(messages.role, 'user')))
            .orderBy(desc(messages.createdAt))
            .limit(1);
          if (!(last[0]?.content === lastUser)) {
            await db!.insert(messages).values({ chatId: chatUuid, role: 'user', content: lastUser });
          }
        }

        // アシスタント応答（直近が assistant の場合は破棄して二連続を防止）
        let assistantPersisted = true;
        const assistantText = String(out.answer ?? '').trim();
        if (assistantText) {
          // 直近メッセージの役割を確認
          const lastMsg = await db!
            .select({ role: messages.role, content: messages.content })
            .from(messages)
            .where(eq(messages.chatId, chatUuid))
            .orderBy(desc(messages.createdAt))
            .limit(1);
          if (lastMsg[0]?.role === 'assistant') {
            assistantPersisted = false; // 破棄
          } else {
            // 直近の assistant と内容が同一なら破棄（保険）
            const lastA = await db!
              .select({ content: messages.content })
              .from(messages)
              .where(and(eq(messages.chatId, chatUuid), eq(messages.role, 'assistant')))
              .orderBy(desc(messages.createdAt))
              .limit(1);
            if (lastA[0]?.content === assistantText) {
              assistantPersisted = false;
            } else {
              await db!.insert(messages).values({ chatId: chatUuid, role: 'assistant', content: assistantText });
              assistantPersisted = true;
            }
          }
        }

        // 更新時刻の更新 + ステータス反映（LLM出力が 0/1 の場合は ended）
        const endedOut = out.status !== -1;
        await db!
          .update(chats)
          .set({ updatedAt: sql`now()`, ...(endedOut ? { status: 'ended' as const } : {}) })
          .where(and(eq(chats.id, chatUuid), eq(chats.userId, userId)));
        // out に副作用メタを埋め込む（クライアントで重複描画を防止するため）
        (out as any).meta = { assistantPersisted };
      } catch (e: any) {
        log.error({ msg: "persist_failed", err: String(e?.message ?? e) });
      }
    }

    if (!isRunChatOutput(out)) {
      log.error({ msg: "invalid_output_shape", out });
      return NextResponse.json({ ok: false, error: "Invalid RunChatOutput" }, { status: 500 });
    }
    log.info({ msg: "response(runChat)", chatId: out.chatId, chars: out.answer.length, status: out.status });
    return NextResponse.json({ ok: true, result: out, meta: (out as any).meta }, { status: 200 });
  } catch (e: any) {
    const log = getLogger("api:chat");
    log.error({ msg: "failed", err: String(e?.message ?? e) });
    return NextResponse.json(
      { ok: false, error: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}

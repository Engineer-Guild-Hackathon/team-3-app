import { NextResponse } from "next/server";
import { runChat } from "@/lib/pipeline";
import { getLogger } from "@/lib/logger";
import { isRunChatInput, isRunChatOutput } from "@/lib/schemas";

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

    const sessionId = `chat:${body.chatId}`;
    log.info({ msg: "request(runChat)", chatId: body.chatId, sessionId, turns: body.history?.length ?? 0 });
    const out = await runChat(body, { sessionId, requestId: reqId });
    if (!isRunChatOutput(out)) {
      log.error({ msg: "invalid_output_shape", out });
      return NextResponse.json({ ok: false, error: "Invalid RunChatOutput" }, { status: 500 });
    }
    log.info({ msg: "response(runChat)", chatId: out.chatId, chars: out.answer.length, status: out.status });
    return NextResponse.json({ ok: true, result: out }, { status: 200 });
  } catch (e: any) {
    const log = getLogger("api:chat");
    log.error({ msg: "failed", err: String(e?.message ?? e) });
    return NextResponse.json(
      { ok: false, error: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}

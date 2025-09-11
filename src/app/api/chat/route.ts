import { NextResponse } from "next/server";
import { runChatWithTools } from "@/lib/pipeline";
import type { LlmMessage } from "@/types/llm";
import { getLogger } from "@/lib/logger";
import { getPrompt, DEFAULT_SYSTEM_BASE_JA } from "@/lib/prompts";

// App Router の Route Handlers 仕様（GET/POST など）に従う
// 参考: nextjs docs route handlers :contentReference[oaicite:6]{index=6}

export async function POST(req: Request) {
  try {
    const log = getLogger("api:chat").child({ reqId: (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)) });
    const body = await req.json().catch(() => ({}));
    const sessionId: string = String(body?.sessionId ?? "default");
    // クライアントから渡されたメッセージがあれば使い、無ければデフォルト
    const messages: LlmMessage[] = body?.messages ?? ([
      { role: "system", content: await getPrompt("system/base-ja", DEFAULT_SYSTEM_BASE_JA) },
      {
        role: "user",
        content: "「(2+3)*4/5 の計算結果」と「Asia/Tokyo の現在時刻」を教えて。",
      },
    ] as LlmMessage[]);

    log.info({ msg: "request", count: (messages as LlmMessage[]).length, sessionId });
    const result = await runChatWithTools(messages, { sessionId });
    log.info({ msg: "response", keys: Object.keys(result.json).length, sessionId });

    return NextResponse.json(
      { ok: true, result },
      { status: 200 }
    );
  } catch (e: any) {
    const log = getLogger("api:chat");
    log.error({ msg: "failed", err: String(e?.message ?? e) });
    return NextResponse.json(
      { ok: false, error: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}

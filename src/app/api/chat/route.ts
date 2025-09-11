import { NextResponse } from "next/server";
import { runChatWithTools, ChatMessage } from "@/lib/pipeline";

// App Router の Route Handlers 仕様（GET/POST など）に従う
// 参考: nextjs docs route handlers :contentReference[oaicite:6]{index=6}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    // クライアントから渡されたメッセージがあれば使い、無ければデフォルト
    const messages: ChatMessage[] =
      body?.messages ??
      ([
        { role: "system", content: "あなたは役に立つアシスタントです。" },
        {
          role: "user",
          content:
            "「(2+3)*4/5 の計算結果」と「Asia/Tokyo の現在時刻」を教えて。",
        },
      ] as ChatMessage[]);

    const result = await runChatWithTools(messages);

    return NextResponse.json(
      { ok: true, result },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("[ERROR] /api/chat:", e);
    return NextResponse.json(
      { ok: false, error: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}

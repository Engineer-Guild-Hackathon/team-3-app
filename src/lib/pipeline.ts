import { getAOAI } from "./openai";

// Next.jsから受け取るメッセージ型（最低限）
export type ChatMessage = { role: "system" | "user" | "assistant" | "tool"; content: string; tool_call_id?: string };

export async function runChatWithTools(initialMessages: ChatMessage[]) {
  console.warn("[INFO] pipeline: start(simple)");
  const messages: any[] = [...initialMessages];
  const model = process.env.AZURE_OPENAI_DEPLOYMENT!; // デプロイメント名

  // ツール呼び出しは行わず、単発の補完のみ実行
  const resp = await getAOAI().chat.completions.create({
    model,
    messages,
  });

  const text = resp.choices?.[0]?.message?.content ?? "";
  console.warn("[INFO] pipeline: final(simple)");
  return { text };
}

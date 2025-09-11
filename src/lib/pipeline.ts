import { aoai } from "./openai";
import { toolDefinitions, runTool, ToolName } from "./tools";

// Next.jsから受け取るメッセージ型（最低限）
export type ChatMessage = { role: "system" | "user" | "assistant" | "tool"; content: string; tool_call_id?: string };

export async function runChatWithTools(initialMessages: ChatMessage[]) {
  console.log("[INFO] pipeline: start");
  const messages: any[] = [...initialMessages];
  // Azure OpenAI のデプロイメント名（= model）
  const model = process.env.AZURE_OPENAI_DEPLOYMENT!;

  // 1st call: tools を渡して自動判断
  let resp = await aoai.chat.completions.create({
    model,
    messages,
    tools: toolDefinitions as any,
    tool_choice: "auto",
    // gpt-5系/Reasoning系は max_completion_tokens を使う
    max_completion_tokens: 400,
  });

  while (true) {
    const choice = resp.choices?.[0];
    const toolCalls = choice?.message?.tool_calls ?? [];

    if (!toolCalls.length) {
      const text = choice?.message?.content ?? "";
      console.log("[INFO] pipeline: final");
      return { text };
    }

    console.log(`[INFO] pipeline: ${toolCalls.length} tool_calls`);

    // assistant 側 tool_calls を会話に積む
    messages.push(choice.message);

    // 各 tool_call を実行し、role=tool で返す
    for (const tc of toolCalls as any[]) {
      // v4 型の union 対応（日本語コメント）
      const name = (tc?.function?.name ?? tc?.name) as ToolName;
      let args: any = {};
      try {
        args = JSON.parse(tc?.function?.arguments ?? tc?.arguments ?? "{}");
      } catch {
        /* noop */
      }
      console.log("[INFO] tool run:", name, args);
      const result = runTool(name, args);
      messages.push({ role: "tool", content: result, tool_call_id: tc.id });
    }

    // ツール結果を踏まえてもう一度
    resp = await aoai.chat.completions.create({
      model,
      messages,
      max_completion_tokens: 400,
    });
  }
}

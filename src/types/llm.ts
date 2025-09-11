export type LlmMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
};

// JSON モード動作用のオプション
export type JsonModeOptions = {
  // 先頭に JSON 出力を強制するシステムメッセージを注入するか
  injectJsonSystemPrompt?: boolean;
};

// JSON 応答の汎用コンテナ（任意キー許容で拡張に強い）
export type JsonResult<T extends Record<string, unknown> = Record<string, unknown>> = {
  json: T;
  text: string; // UI 表示向けの整形文字列
};


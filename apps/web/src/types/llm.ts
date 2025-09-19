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

// ラン実行オプション（会話履歴をセッション単位で保持）
export type RunChatOptions = JsonModeOptions & {
  sessionId?: string; // セッションID（未指定時は "default"）
  maxHistory?: number; // 直近のメッセージ件数上限（デフォルト 20）
  requestId?: string; // 相関ID（API から受け取る）
};

export type ChatStates = -1 | 0 | 1 | 999;

export type ConversationTurn = {
  // assistant: LLM（アシスタント）が送信したメッセージ
  assistant: string;
  assistantStatus?: ChatStates;
  // user: ユーザーが送信したメッセージ
  user: string;
  userStatus?: ChatStates;
};

export type RunChatInput = {
  chatId: number; // 会話ID（数値）
  subject: string; // 題目
  theme: string; // テーマ
  description?: string; // 詳細説明（任意）：教科・分野の補足情報
  // clientSessionId: フロントエンド側のセッションID（UUID）。DB上の chats.id と一致させるために使用（任意）。
  clientSessionId?: string;
  // 履歴は { assistant, user } の配列（時系列順）
  history: ConversationTurn[];
};

export type RunChatOutput = {
  chatId: number; // 入力と同じ chatId を返す
  answer: string; // LLM の出力文章
  status: ChatStates; // -1 | 0 | 1 | 999
};

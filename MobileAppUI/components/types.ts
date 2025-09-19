export type ChatHistoryEntry = {
  id: string;
  title: string;
  snippet?: string;
  timestamp?: string;
  unread?: boolean;
};

export type ChatMessage = {
  id: string;
  author: "user" | "assistant";
  text: string;
  createdAt: string;
  pending?: boolean;
};

export type ChatThread = {
  id: string;
  title: string;
  messages: ChatMessage[];
  unread?: boolean;
};

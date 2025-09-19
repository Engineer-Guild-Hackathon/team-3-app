export type ChatHistoryEntry = {
  id: string;
  title: string;
  snippet?: string;
  timestamp?: string;
  unread?: boolean;
  lastAssistantStatus?: -1 | 0 | 1;
};

export type ChatMessage = {
  id: string;
  author: "user" | "assistant";
  text: string;
  createdAt: string;
  pending?: boolean;
  status?: -1 | 0 | 1;
};

export type ChatThread = {
  id: string;
  title: string;
  messages: ChatMessage[];
  unread?: boolean;
  status?: "in_progress" | "ended";
  subjectId?: string | null;
  topicId?: string | null;
  updatedAt?: string;
  createdAt?: string;
  messagesLoaded?: boolean;
  isLoadingMessages?: boolean;
};

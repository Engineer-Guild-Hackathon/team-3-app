export type AssistantStatusKey = -1 | 0 | 1;
export type AssistantRawStatus = -2 | -1 | 0 | 1 | 999;

export type ChatHistoryEntry = {
  id: string;
  title: string;
  snippet?: string;
  timestamp?: string;
  unread?: boolean;
  lastAssistantStatus?: AssistantStatusKey;
};

export type ChatMessage = {
  id: string;
  author: "user" | "assistant";
  text: string;
  createdAt: string;
  pending?: boolean;
  status?: AssistantRawStatus;
};

export type ChatThread = {
  id: string;
  title: string;
  messages: ChatMessage[];
  unread?: boolean;
  status?: "in_progress" | "ended";
  subjectId?: string | null;
  topicId?: string | null;
  subjectLabel?: string | null;
  topicLabel?: string | null;
  topicDescription?: string | null;
  updatedAt?: string;
  createdAt?: string;
  messagesLoaded?: boolean;
  isLoadingMessages?: boolean;
};

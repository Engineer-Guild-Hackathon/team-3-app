import type { ChatHistoryEntry, ChatThread } from "../components/types";

export const buildHistoryEntry = (thread: ChatThread): ChatHistoryEntry => {
  const lastMessage = thread.messages[thread.messages.length - 1];

  return {
    id: thread.id,
    title: thread.title,
    snippet: lastMessage?.text,
    timestamp: lastMessage?.createdAt,
    unread: thread.unread,
  };
};

import type { ChatHistoryEntry, ChatThread } from "../components/types";
import { normalizeAssistantStatus } from "./status";

export const buildHistoryEntry = (thread: ChatThread): ChatHistoryEntry => {
  const lastMessage = thread.messages[thread.messages.length - 1];
  const isAssistantLast = lastMessage?.author === "assistant";
  const timestamp =
    lastMessage?.createdAt ?? thread.updatedAt ?? thread.createdAt ?? "";

  return {
    id: thread.id,
    title: thread.title,
    snippet: lastMessage?.text,
    timestamp,
    unread: isAssistantLast,
    lastAssistantStatus:
      isAssistantLast && !lastMessage?.pending
        ? normalizeAssistantStatus(lastMessage?.status)
        : undefined,
  };
};

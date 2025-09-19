import type { ChatHistoryEntry, ChatMessage, ChatThread } from "../components/types";
import { SAMPLE_THREADS } from "../data/sampleThreads";
import { buildHistoryEntry } from "./chatHistory";

const DEFAULT_HISTORY_LIMIT = 3;
const DEFAULT_MESSAGE_LIMIT = 3;

const cloneMessage = (message: ChatMessage): ChatMessage => ({ ...message });

const pickThread = (threads: ChatThread[]): ChatThread | null => threads[0] ?? null;

export const getSampleHistoryEntries = (
  limit: number = DEFAULT_HISTORY_LIMIT,
): ChatHistoryEntry[] => {
  if (limit <= 0) {
    return [];
  }
  return SAMPLE_THREADS.slice(0, limit).map((thread) => buildHistoryEntry(thread));
};

export const getSampleChatMessages = (
  limit: number = DEFAULT_MESSAGE_LIMIT,
): ChatMessage[] => {
  if (limit <= 0) {
    return [];
  }
  const thread = pickThread(SAMPLE_THREADS);
  if (!thread) {
    return [];
  }
  return thread.messages.slice(0, limit).map(cloneMessage);
};

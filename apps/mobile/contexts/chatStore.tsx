import * as React from 'react';
import * as Crypto from 'expo-crypto';

import { useAuth } from './auth';
import type { ChatHistoryEntry, ChatMessage, ChatThread } from '../components/types';
import { buildHistoryEntry } from '../utils/chatHistory';
import { numericIdFromUuid } from '../utils/id';
import { messagesToTurns } from '../utils/messages';
import { nowAsIsoString } from '../utils/datetime';

function ensureJson<T>(value: T | Response): T {
  if (value instanceof Response) {
    throw new Error('Unexpected response format');
  }
  return value;
}

const extractStatus = (error: unknown): number | undefined => {
  const status = (error as { status?: number })?.status;
  return typeof status === 'number' ? status : undefined;
};

const isUnauthorizedStatus = (status?: number): boolean => status === 401 || status === 403;

const DEFAULT_CHAT_TITLE = '新しいチャット';

export type ChatStoreValue = {
  threads: ChatThread[];
  histories: ChatHistoryEntry[];
  isLoading: boolean;
  errorMessage: string | null;
  reloadThreads: () => Promise<void>;
  ensureMessages: (chatId: string) => Promise<void>;
  createThread: (options?: { title?: string }) => Promise<ChatThread | null>;
  sendMessage: (chatId: string, text: string) => Promise<void>;
  updateThreadTitle: (chatId: string, title: string) => void;
  clearForSignOut: () => void;
};

const ChatStoreContext = React.createContext<ChatStoreValue | null>(null);

export type ChatStoreProviderProps = {
  children: React.ReactNode;
};

type ChatSummaryResponse = {
  items?: Array<{
    id: string;
    title?: string;
    status?: 'in_progress' | 'ended';
    subjectId?: string | null;
    topicId?: string | null;
    updatedAt?: string;
    createdAt?: string;
  }>;
};

type MessageResponse = {
  items?: Array<{
    id: string;
    role: string;
    content: string;
    createdAt?: string;
  }>;
};

type RunChatResponse = {
  chatId?: string;
  answer?: string;
  status?: -1 | 0 | 1;
  result?: {
    answer?: string;
    status?: -1 | 0 | 1;
  };
  meta?: {
    assistantPersisted?: boolean;
  };
};

export const ChatStoreProvider = ({ children }: ChatStoreProviderProps) => {
  const { apiClient, isAuthenticated, setStatus, reauthenticate } = useAuth();
  const [threads, setThreads] = React.useState<ChatThread[]>([]);
  const threadsRef = React.useRef<ChatThread[]>(threads);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    threadsRef.current = threads;
  }, [threads]);

  const histories = React.useMemo(() => threads.map((thread) => buildHistoryEntry(thread)), [threads]);

  const clearForSignOut = React.useCallback(() => {
    setThreads([]);
    setErrorMessage(null);
  }, []);

  const reloadThreads = React.useCallback(async () => {
    if (!isAuthenticated) {
      clearForSignOut();
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const raw = await apiClient.send<ChatSummaryResponse>('/api/v1/chats');
      const data = ensureJson(raw);
      const items = data?.items ?? [];
      setThreads((prev) => {
        const next = items.map<ChatThread>((item) => {
          const existing = prev.find((thread) => thread.id === item.id);
          return {
            id: item.id,
            title: item.title && item.title.trim().length > 0 ? item.title : DEFAULT_CHAT_TITLE,
            status: item.status ?? existing?.status ?? 'in_progress',
            subjectId: item.subjectId ?? existing?.subjectId,
            topicId: item.topicId ?? existing?.topicId,
            updatedAt: item.updatedAt ?? existing?.updatedAt,
            createdAt: item.createdAt ?? existing?.createdAt,
            messages: existing?.messages ?? [],
            messagesLoaded: existing?.messagesLoaded ?? false,
          };
        });
        return next;
      });
    } catch (error) {
      const status = extractStatus(error);
      if (isUnauthorizedStatus(status)) {
        await reauthenticate();
        return;
      }
      setErrorMessage(error instanceof Error ? error.message : String(error));
      setStatus('チャット一覧の取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [apiClient, clearForSignOut, isAuthenticated, reauthenticate, setStatus]);

  const ensureMessages = React.useCallback(
    async (chatId: string) => {
      if (!isAuthenticated) return;
      const snapshot = threadsRef.current.find((thread) => thread.id === chatId);
      if (snapshot?.messagesLoaded) {
        return;
      }
      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === chatId
            ? {
                ...thread,
                isLoadingMessages: thread.messagesLoaded ? false : true,
              }
            : thread,
        ),
      );
      try {
        const raw = await apiClient.send<MessageResponse>(`/api/v1/chats/${chatId}/messages`);
        const data = ensureJson(raw);
        const items = data?.items ?? [];
        const messages: ChatMessage[] = items.map((item) => ({
          id: item.id,
          author: item.role === 'assistant' ? 'assistant' : 'user',
          text: item.content ?? '',
          createdAt: item.createdAt ?? nowAsIsoString(),
          pending: false,
          status: item.role === 'assistant' ? -1 : undefined,
        }));
        setThreads((prev) =>
          prev.map((thread) =>
            thread.id === chatId
              ? {
                  ...thread,
                  messages,
                  messagesLoaded: true,
                  isLoadingMessages: false,
                  updatedAt: thread.updatedAt ?? messages.at(-1)?.createdAt,
                }
              : thread,
          ),
        );
      } catch (error) {
        setThreads((prev) =>
          prev.map((thread) =>
            thread.id === chatId
              ? {
                  ...thread,
                  isLoadingMessages: false,
                }
              : thread,
          ),
        );
        const status = extractStatus(error);
        if (isUnauthorizedStatus(status)) {
          await reauthenticate();
          return;
        }
        setErrorMessage(error instanceof Error ? error.message : String(error));
        setStatus('メッセージの取得に失敗しました');
      }
    },
    [apiClient, isAuthenticated, reauthenticate, setStatus],
  );

  const createThread = React.useCallback(
    async (options?: { title?: string }) => {
      if (!isAuthenticated) {
        setStatus('ログインが必要です');
        return null;
      }
      setErrorMessage(null);
      try {
        const payload = {
          title: options?.title,
        };
        const raw = await apiClient.send<{
          id: string;
          title?: string;
          status?: 'in_progress' | 'ended';
          createdAt?: string;
          updatedAt?: string;
        }>('/api/v1/chats', {
          method: 'POST',
          body: payload,
          okStatuses: [200, 201],
        });
        const created = ensureJson(raw);
        const newThread: ChatThread = {
          id: created?.id ?? Crypto.randomUUID(),
          title: created?.title && created.title.trim().length > 0 ? created.title : DEFAULT_CHAT_TITLE,
          status: created?.status ?? 'in_progress',
          createdAt: created?.createdAt,
          updatedAt: created?.updatedAt,
          messages: [],
          messagesLoaded: false,
        };
        setThreads((prev) => [newThread, ...prev.filter((thread) => thread.id !== newThread.id)]);
        setStatus('チャットを作成しました');
        return newThread;
      } catch (error) {
        const status = extractStatus(error);
        if (isUnauthorizedStatus(status)) {
          await reauthenticate();
          return null;
        }
        setErrorMessage(error instanceof Error ? error.message : String(error));
        setStatus('チャットの作成に失敗しました');
        return null;
      }
    },
    [apiClient, isAuthenticated, reauthenticate, setStatus],
  );

  const updateThreadTitle = React.useCallback((chatId: string, title: string) => {
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === chatId
          ? {
              ...thread,
              title,
            }
          : thread,
      ),
    );
  }, []);

  const sendMessage = React.useCallback(
    async (chatId: string, text: string) => {
      if (!isAuthenticated) {
        setStatus('ログインが必要です');
        return;
      }
      const trimmed = text.trim();
      if (!trimmed) return;

      const now = nowAsIsoString();
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        author: 'user',
        text: trimmed,
        createdAt: now,
      };
      const placeholderId = `assistant-${Date.now()}`;
      const pendingAssistant: ChatMessage = {
        id: placeholderId,
        author: 'assistant',
        text: '考え中...',
        createdAt: now,
        pending: true,
        status: -1,
      };

      const targetSnapshot = threadsRef.current.find((thread) => thread.id === chatId);
      const baseMessages = targetSnapshot?.messages ?? [];
      const requestMessages = baseMessages.concat(userMessage);

      setThreads((prev) => {
        const exists = prev.some((thread) => thread.id === chatId);
        if (!exists) {
          const fallbackTitle = targetSnapshot?.title ?? DEFAULT_CHAT_TITLE;
          const newThread: ChatThread = {
            id: chatId,
            title: fallbackTitle,
            messages: [userMessage, pendingAssistant],
            status: 'in_progress',
            updatedAt: now,
            createdAt: now,
            messagesLoaded: true,
          };
          return [...prev, newThread];
        }
        return prev.map((thread) =>
          thread.id === chatId
            ? {
                ...thread,
                messages: [...thread.messages, userMessage, pendingAssistant],
                updatedAt: now,
              }
            : thread,
        );
      });

      try {
        const turns = messagesToTurns(requestMessages);
        const numericId = numericIdFromUuid(chatId);
        const responseRaw = await apiClient.send<RunChatResponse>('/api/v1/chat', {
          method: 'POST',
          body: {
            chatId: numericId,
            subject:
              (targetSnapshot?.title && targetSnapshot.title.trim().length > 0
                ? targetSnapshot.title
                : DEFAULT_CHAT_TITLE) ?? DEFAULT_CHAT_TITLE,
            theme: '一般',
            clientSessionId: chatId,
            history: turns,
          },
        });
        const response = ensureJson(responseRaw);
        const answer =
          (response?.result?.answer ?? response?.answer ?? '').toString() || '回答を取得できませんでした';
        const status = response?.result?.status ?? response?.status ?? -1;
        const assistantMessage: ChatMessage = {
          id: placeholderId,
          author: 'assistant',
          text: answer,
          createdAt: nowAsIsoString(),
          pending: false,
          status,
        };
        setThreads((prev) => {
          const exists = prev.some((thread) => thread.id === chatId);
          if (!exists) {
            const newThread: ChatThread = {
              id: chatId,
              title: trimmed.slice(0, 24) || targetSnapshot?.title || DEFAULT_CHAT_TITLE,
              messages: [userMessage, assistantMessage],
              status: status === -1 ? 'in_progress' : 'ended',
              updatedAt: assistantMessage.createdAt,
              createdAt: targetSnapshot?.createdAt ?? now,
              messagesLoaded: true,
            };
            return [...prev, newThread];
          }
          return prev.map((thread) =>
            thread.id === chatId
              ? {
                  ...thread,
                  messages: thread.messages.map((message) =>
                    message.id === placeholderId ? assistantMessage : message,
                  ),
                  title:
                    thread.title === DEFAULT_CHAT_TITLE && trimmed ? trimmed.slice(0, 24) : thread.title,
                  updatedAt: assistantMessage.createdAt,
                  status: status === -1 ? 'in_progress' : 'ended',
                  messagesLoaded: true,
                }
              : thread,
          );
        });
      } catch (error) {
        const status = extractStatus(error);
        const unauthorized = isUnauthorizedStatus(status);
        const failMessage: ChatMessage = {
          id: placeholderId,
          author: 'assistant',
          text: unauthorized
            ? 'セッションが切れました。再ログインしてください。'
            : `エラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
          createdAt: nowAsIsoString(),
          pending: false,
          status: unauthorized ? -1 : 0,
        };
        setThreads((prev) => {
          const exists = prev.some((thread) => thread.id === chatId);
          if (!exists) {
            const newThread: ChatThread = {
              id: chatId,
              title: targetSnapshot?.title ?? DEFAULT_CHAT_TITLE,
              messages: [userMessage, failMessage],
              status: 'in_progress',
              updatedAt: failMessage.createdAt,
              createdAt: targetSnapshot?.createdAt ?? now,
              messagesLoaded: true,
            };
            return [...prev, newThread];
          }
          return prev.map((thread) =>
            thread.id === chatId
              ? {
                  ...thread,
                  messages: thread.messages.map((message) =>
                    message.id === placeholderId ? failMessage : message,
                  ),
                  messagesLoaded: true,
                }
              : thread,
          );
        });
        if (unauthorized) {
          await reauthenticate();
          return;
        }
        setStatus('メッセージ送信に失敗しました');
      }
    },
    [apiClient, isAuthenticated, reauthenticate, setStatus, threads],
  );

  React.useEffect(() => {
    if (isAuthenticated) {
      reloadThreads();
    } else {
      clearForSignOut();
    }
  }, [clearForSignOut, isAuthenticated, reloadThreads]);

  const value = React.useMemo<ChatStoreValue>(
    () => ({
      threads,
      histories,
      isLoading,
      errorMessage,
      reloadThreads,
      ensureMessages,
      createThread,
      sendMessage,
      updateThreadTitle,
      clearForSignOut,
    }),
    [
      clearForSignOut,
      createThread,
      ensureMessages,
      errorMessage,
      histories,
      isLoading,
      reloadThreads,
      sendMessage,
      threads,
      updateThreadTitle,
    ],
  );

  return <ChatStoreContext.Provider value={value}>{children}</ChatStoreContext.Provider>;
};

export const useChatStore = (): ChatStoreValue => {
  const context = React.useContext(ChatStoreContext);
  if (!context) {
    throw new Error('useChatStore は ChatStoreProvider 内で使用してください');
  }
  return context;
};

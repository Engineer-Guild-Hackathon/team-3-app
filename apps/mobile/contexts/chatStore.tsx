import * as React from 'react';
import * as Crypto from 'expo-crypto';

import { useAuth } from './auth';
import { useSubjectStore } from './subjectStore';
import type { SubjectDefinition } from './subjectStore';
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

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

function coerceUuid(value?: string | null): string | null {
  if (!value) {
    return null;
  }
  return isUuid(value) ? value : null;
}

type SubjectTopicDefinition = SubjectDefinition['topics'][number];

type TopicSelectionCandidate = {
  subjectId: string;
  subjectLabel: string;
  topicId: string | null;
  topicLabel: string | null;
  topicDescription: string | null;
};

// ユーザー設定からランダムに割り当てる科目とテーマを決定する
function buildTopicCandidates(
  subjects: SubjectDefinition[],
  savedSelections: Record<string, string[]>,
): TopicSelectionCandidate[] {
  const candidates: TopicSelectionCandidate[] = [];
  const subjectMap = new Map(subjects.map((subject) => [subject.id, subject]));

  Object.entries(savedSelections).forEach(([subjectId, topicIds]) => {
    const subject = subjectMap.get(subjectId);
    if (!subject) {
      return;
    }
    const validTopics = topicIds
      .map((topicId) => subject.topics.find((topic) => topic.id === topicId))
      .filter((topic): topic is SubjectTopicDefinition => Boolean(topic?.description));
    const fallbackTopics = subject.topics.filter((topic) => Boolean(topic.description));
    const targets = validTopics.length > 0 ? validTopics : fallbackTopics;
    if (targets.length === 0) {
      candidates.push({
        subjectId: subject.id,
        subjectLabel: subject.label,
        topicId: null,
        topicLabel: null,
        topicDescription: null,
      });
      return;
    }
    targets.forEach((topic) => {
      candidates.push({
        subjectId: subject.id,
        subjectLabel: subject.label,
        topicId: topic.id,
        topicLabel: topic.label,
        topicDescription: topic.description ?? null,
      });
    });
  });

  if (candidates.length === 0) {
    subjects.forEach((subject) => {
      const availableTopics = subject.topics.filter((topic) => Boolean(topic.description));
      if (availableTopics.length === 0) {
        candidates.push({
          subjectId: subject.id,
          subjectLabel: subject.label,
          topicId: null,
          topicLabel: null,
          topicDescription: null,
        });
        return;
      }
      availableTopics.forEach((topic) => {
        candidates.push({
          subjectId: subject.id,
          subjectLabel: subject.label,
          topicId: topic.id,
          topicLabel: topic.label,
          topicDescription: topic.description ?? null,
        });
      });
    });
  }

  return candidates;
}

function pickRandomTopicCandidate(
  subjects: SubjectDefinition[],
  savedSelections: Record<string, string[]>,
): TopicSelectionCandidate | null {
  const candidates = buildTopicCandidates(subjects, savedSelections);
  if (candidates.length === 0) {
    return null;
  }
  const index = Math.floor(Math.random() * candidates.length);
  return candidates[index];
}

function resolveSubjectLabels(
  subjects: SubjectDefinition[],
  subjectId?: string | null,
  topicId?: string | null,
) {
  if (!subjectId) {
    return { subjectLabel: null, topicLabel: null, topicDescription: null };
  }
  const subject = subjects.find((item) => item.id === subjectId);
  if (!subject) {
    return { subjectLabel: null, topicLabel: null, topicDescription: null };
  }
  const topic = topicId ? subject.topics.find((item) => item.id === topicId) : null;
  return {
    subjectLabel: subject.label,
    topicLabel: topic?.label ?? null,
    topicDescription: topic?.description ?? null,
  };
}

function buildChatContext(
  subjects: SubjectDefinition[],
  options: {
    subjectId?: string | null;
    topicId?: string | null;
    title?: string | null;
    subjectLabel?: string | null;
    topicLabel?: string | null;
    topicDescription?: string | null;
  },
) {
  const { subjectLabel, topicLabel, topicDescription } = resolveSubjectLabels(
    subjects,
    options.subjectId,
    options.topicId,
  );
  const fallbackTitle = options.title && options.title.trim().length > 0 ? options.title.trim() : DEFAULT_CHAT_TITLE;
  const resolvedSubjectLabel = subjectLabel ?? options.subjectLabel ?? null;
  const resolvedTopicLabel = topicLabel ?? options.topicLabel ?? null;
  const resolvedDescription = topicDescription ?? options.topicDescription ?? null;
  const subjectName = resolvedSubjectLabel ?? fallbackTitle;
  const themeName = resolvedTopicLabel ?? resolvedSubjectLabel ?? fallbackTitle;
  return { subjectName, themeName, description: resolvedDescription };
}

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
  const { subjects, savedSelections } = useSubjectStore();
  const [threads, setThreads] = React.useState<ChatThread[]>([]);
  const threadsRef = React.useRef<ChatThread[]>(threads);
  const autoIntroRequestedRef = React.useRef<Record<string, boolean>>({});
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
          const subjectId = item.subjectId ?? existing?.subjectId ?? null;
          const topicId = item.topicId ?? existing?.topicId ?? null;
          const { subjectLabel, topicLabel, topicDescription } = resolveSubjectLabels(
            subjects,
            subjectId,
            topicId,
          );
          const resolvedSubjectLabel = subjectLabel ?? existing?.subjectLabel ?? null;
          const resolvedTopicLabel = topicLabel ?? existing?.topicLabel ?? null;
          const resolvedDescription = topicDescription ?? existing?.topicDescription ?? null;
          return {
            id: item.id,
            title: item.title && item.title.trim().length > 0 ? item.title : DEFAULT_CHAT_TITLE,
            status: item.status ?? existing?.status ?? 'in_progress',
            subjectId,
            topicId,
            subjectLabel: resolvedSubjectLabel,
            topicLabel: resolvedTopicLabel,
            topicDescription: resolvedDescription,
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
  }, [apiClient, clearForSignOut, isAuthenticated, reauthenticate, setStatus, subjects]);

  const requestAutoIntro = React.useCallback(
    async (chatId: string, fallbackThread?: ChatThread) => {
      if (!isAuthenticated) {
        return;
      }
      if (autoIntroRequestedRef.current[chatId]) {
        return;
      }
      const baseSnapshot =
        threadsRef.current.find((thread) => thread.id === chatId) ?? fallbackThread ?? null;
      if (!baseSnapshot) {
        return;
      }
      const hasResolvedMessage = baseSnapshot.messages.some((message) => !message.pending);
      if (hasResolvedMessage) {
        autoIntroRequestedRef.current[chatId] = true;
        return;
      }
      autoIntroRequestedRef.current[chatId] = true;

      const now = nowAsIsoString();
      const placeholderId = `assistant-intro-${chatId}`;
      const pendingAssistant: ChatMessage = {
        id: placeholderId,
        author: 'assistant',
        text: '考え中...',
        createdAt: now,
        pending: true,
        status: -1,
      };

      setThreads((prev) => {
        const exists = prev.some((thread) => thread.id === chatId);
        if (!exists) {
          const baseMessages = baseSnapshot.messages ?? [];
          const hasPlaceholder = baseMessages.some((message) => message.id === placeholderId);
          const withPending = hasPlaceholder
            ? baseMessages
            : [...baseMessages, pendingAssistant];
          const nextThread: ChatThread = {
            ...baseSnapshot,
            messages: withPending,
            messagesLoaded: true,
            updatedAt: now,
          };
          return [nextThread, ...prev];
        }
        return prev.map((thread) =>
          thread.id === chatId
            ? {
                ...thread,
                messages: thread.messages.some((message) => message.id === placeholderId)
                  ? thread.messages
                  : [...thread.messages, pendingAssistant],
                messagesLoaded: true,
                updatedAt: now,
              }
            : thread,
        );
      });

      try {
        const baseMessages = baseSnapshot.messages;
        const turns = messagesToTurns(baseMessages);
        const numericId = numericIdFromUuid(chatId);
        const { subjectName, themeName, description } = buildChatContext(subjects, {
          subjectId: baseSnapshot.subjectId,
          topicId: baseSnapshot.topicId,
          title: baseSnapshot.title,
          subjectLabel: baseSnapshot.subjectLabel ?? null,
          topicLabel: baseSnapshot.topicLabel ?? null,
          topicDescription: baseSnapshot.topicDescription ?? null,
        });
        const responseRaw = await apiClient.send<RunChatResponse>('/api/v1/chat', {
          method: 'POST',
          body: {
            chatId: numericId,
            subject: subjectName,
            theme: themeName,
            description: description ?? undefined,
            clientSessionId: chatId,
            history: turns,
          },
        });
        const response = ensureJson(responseRaw);
        const answer =
          (response?.result?.answer ?? response?.answer ?? '').toString() || '質問を取得できませんでした';
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
            const baseMessages = baseSnapshot.messages ?? [];
            const hasPlaceholder = baseMessages.some((message) => message.id === placeholderId);
            const mergedMessages = hasPlaceholder
              ? baseMessages.map((message) => (message.id === placeholderId ? assistantMessage : message))
              : [...baseMessages, assistantMessage];
            const nextThread: ChatThread = {
              ...baseSnapshot,
              messages: mergedMessages,
              title:
                baseSnapshot.title === DEFAULT_CHAT_TITLE && answer ? answer.slice(0, 24) : baseSnapshot.title,
              updatedAt: assistantMessage.createdAt,
              status: status === -1 ? 'in_progress' : 'ended',
              messagesLoaded: true,
            };
            return [nextThread, ...prev];
          }
          return prev.map((thread) => {
            if (thread.id !== chatId) {
              return thread;
            }
            const updatedMessages = (() => {
              let replaced = false;
              const mapped = thread.messages.map((message) => {
                if (message.id === placeholderId) {
                  replaced = true;
                  return assistantMessage;
                }
                return message;
              });
              if (!replaced) {
                return [...thread.messages, assistantMessage];
              }
              return mapped;
            })();
            return {
              ...thread,
              messages: updatedMessages,
              title:
                thread.title === DEFAULT_CHAT_TITLE && answer ? answer.slice(0, 24) : thread.title,
              updatedAt: assistantMessage.createdAt,
              status: status === -1 ? 'in_progress' : 'ended',
              messagesLoaded: true,
            };
          });
        });
      } catch (error) {
        const status = extractStatus(error);
        const unauthorized = isUnauthorizedStatus(status);
        const failMessage: ChatMessage = {
          id: placeholderId,
          author: 'assistant',
          text: unauthorized
            ? 'セッションが切れました。再ログインしてください。'
            : `質問の取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
          createdAt: nowAsIsoString(),
          pending: false,
          status: unauthorized ? -1 : 0,
        };
        setThreads((prev) => {
          const exists = prev.some((thread) => thread.id === chatId);
          if (!exists) {
            const baseMessages = baseSnapshot.messages ?? [];
            const hasPlaceholder = baseMessages.some((message) => message.id === placeholderId);
            const merged = hasPlaceholder
              ? baseMessages.map((message) => (message.id === placeholderId ? failMessage : message))
              : [...baseMessages, failMessage];
            const nextThread: ChatThread = {
              ...baseSnapshot,
              messages: merged,
              messagesLoaded: true,
            };
            return [nextThread, ...prev];
          }
          return prev.map((thread) => {
            if (thread.id !== chatId) {
              return thread;
            }
            let replaced = false;
            const updatedMessages = thread.messages.map((message) => {
              if (message.id === placeholderId) {
                replaced = true;
                return failMessage;
              }
              return message;
            });
            if (!replaced) {
              updatedMessages.push(failMessage);
            }
            return {
              ...thread,
              messages: updatedMessages,
              messagesLoaded: true,
            };
          });
        });
        if (unauthorized) {
          autoIntroRequestedRef.current[chatId] = false;
          await reauthenticate();
          return;
        }
        setErrorMessage(error instanceof Error ? error.message : String(error));
        setStatus('最初の質問の取得に失敗しました');
        autoIntroRequestedRef.current[chatId] = false;
      }
    },
    [apiClient, isAuthenticated, reauthenticate, setErrorMessage, setStatus, subjects],
  );

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
        const hasServerMessages = messages.length > 0;
        setThreads((prev) =>
          prev.map((thread) =>
            thread.id === chatId
              ? {
                  ...thread,
                  messages: hasServerMessages ? messages : thread.messages,
                  messagesLoaded: true,
                  isLoadingMessages: false,
                  updatedAt: hasServerMessages
                    ? messages.at(-1)?.createdAt ?? thread.updatedAt ?? nowAsIsoString()
                    : thread.updatedAt,
                }
              : thread,
          ),
        );
        if (!hasServerMessages) {
          await requestAutoIntro(chatId, snapshot ?? undefined);
        }
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
    [apiClient, isAuthenticated, reauthenticate, requestAutoIntro, setStatus],
  );

  const createThread = React.useCallback(
    async (options?: { title?: string }) => {
      if (!isAuthenticated) {
        setStatus('ログインが必要です');
        return null;
      }
      setErrorMessage(null);
      try {
        const selection = pickRandomTopicCandidate(subjects, savedSelections);
        const payload: Record<string, unknown> = {};
        if (options?.title) {
          payload.title = options.title;
        }
        const candidateSubjectId = coerceUuid(selection?.subjectId ?? null);
        const candidateTopicId = coerceUuid(selection?.topicId ?? null);
        if (candidateSubjectId) {
          payload.subjectId = candidateSubjectId;
        }
        if (candidateTopicId) {
          payload.topicId = candidateTopicId;
        }
        const raw = await apiClient.send<{
          id: string;
          title?: string;
          status?: 'in_progress' | 'ended';
          createdAt?: string;
          updatedAt?: string;
          subjectId?: string | null;
          topicId?: string | null;
        }>('/api/v1/chats', {
          method: 'POST',
          body: payload,
          okStatuses: [200, 201],
        });
        const created = ensureJson(raw);
        const resolvedId = created?.id ?? Crypto.randomUUID();
        const pendingCreatedAt = nowAsIsoString();
        const resolvedSubjectId = coerceUuid(created?.subjectId ?? null) ?? candidateSubjectId;
        const resolvedTopicId = coerceUuid(created?.topicId ?? null) ?? candidateTopicId;
        const resolvedLabels = resolveSubjectLabels(subjects, resolvedSubjectId, resolvedTopicId);
        const subjectLabel = resolvedLabels.subjectLabel ?? selection?.subjectLabel ?? null;
        const topicLabel = resolvedLabels.topicLabel ?? selection?.topicLabel ?? null;
        const topicDescription = resolvedLabels.topicDescription ?? selection?.topicDescription ?? null;
        const introPlaceholderId = `assistant-intro-${resolvedId}`;
        const introPlaceholder: ChatMessage = {
          id: introPlaceholderId,
          author: 'assistant',
          text: '考え中...',
          createdAt: pendingCreatedAt,
          pending: true,
          status: -1,
        };
        const newThread: ChatThread = {
          id: resolvedId,
          title:
            created?.title && created.title.trim().length > 0 ? created.title : DEFAULT_CHAT_TITLE,
          status: created?.status ?? 'in_progress',
          subjectId: resolvedSubjectId,
          topicId: resolvedTopicId,
          subjectLabel,
          topicLabel,
          topicDescription,
          createdAt: created?.createdAt ?? pendingCreatedAt,
          updatedAt: created?.updatedAt ?? pendingCreatedAt,
          messages: [introPlaceholder],
          messagesLoaded: true,
        };
        setThreads((prev) => [newThread, ...prev.filter((thread) => thread.id !== newThread.id)]);
        setStatus('チャットを作成しました');
        void requestAutoIntro(newThread.id, newThread);
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
    [
      apiClient,
      isAuthenticated,
      reauthenticate,
      requestAutoIntro,
      savedSelections,
      setErrorMessage,
      setStatus,
      subjects,
    ],
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
            subjectId: targetSnapshot?.subjectId ?? null,
            topicId: targetSnapshot?.topicId ?? null,
            subjectLabel: targetSnapshot?.subjectLabel ?? null,
            topicLabel: targetSnapshot?.topicLabel ?? null,
            topicDescription: targetSnapshot?.topicDescription ?? null,
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
        const { subjectName, themeName, description } = buildChatContext(subjects, {
          subjectId: targetSnapshot?.subjectId,
          topicId: targetSnapshot?.topicId,
          title: targetSnapshot?.title,
          subjectLabel: targetSnapshot?.subjectLabel ?? null,
          topicLabel: targetSnapshot?.topicLabel ?? null,
          topicDescription: targetSnapshot?.topicDescription ?? null,
        });
        const responseRaw = await apiClient.send<RunChatResponse>('/api/v1/chat', {
          method: 'POST',
          body: {
            chatId: numericId,
            subject: subjectName,
            theme: themeName,
            description: description ?? undefined,
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
              subjectId: targetSnapshot?.subjectId ?? null,
              topicId: targetSnapshot?.topicId ?? null,
              subjectLabel: targetSnapshot?.subjectLabel ?? null,
              topicLabel: targetSnapshot?.topicLabel ?? null,
              topicDescription: targetSnapshot?.topicDescription ?? null,
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
              subjectId: targetSnapshot?.subjectId ?? null,
              topicId: targetSnapshot?.topicId ?? null,
              subjectLabel: targetSnapshot?.subjectLabel ?? null,
              topicLabel: targetSnapshot?.topicLabel ?? null,
              topicDescription: targetSnapshot?.topicDescription ?? null,
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
    [apiClient, isAuthenticated, reauthenticate, setStatus, subjects, threads],
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

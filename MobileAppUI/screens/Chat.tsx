import * as React from "react";
import { KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ChatMainArea from "../components/ChatMainArea";
import HistoryDrawer from "../components/HistoryDrawer";
import PageShell from "../components/PageShell";
import { chatHeaderConfig } from "../components/headerConfigs";
import type { HeaderConfig } from "../components/headerTypes";
import type { ChatHistoryEntry, ChatMessage, ChatThread } from "../components/types";
import { SAMPLE_THREADS } from "../data/sampleThreads";
import type { RootStackParamList } from "../navigation/types";
import { buildHistoryEntry } from "../utils/chatHistory";

type ChatScreenProps = NativeStackScreenProps<RootStackParamList, "Chat">;

const formatTime = (date: Date): string =>
  Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit" }).format(date);

const Chat = ({ navigation, route }: ChatScreenProps) => {
  const insets = useSafeAreaInsets();
  const [threads, setThreads] = React.useState<ChatThread[]>(SAMPLE_THREADS);
  const [activeThreadId, setActiveThreadId] = React.useState<string>(
    () => route.params?.threadId ?? SAMPLE_THREADS[0]?.id ?? "",
  );
  const pendingReplies = React.useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  React.useEffect(() => {
    const targetId = route.params?.threadId;
    if (!targetId || targetId === activeThreadId) {
      return;
    }

    const exists = threads.some((thread) => thread.id === targetId);
    if (!exists) {
      return;
    }

    setActiveThreadId(targetId);
    setThreads((prev) =>
      prev.map((thread) =>
        thread.id === targetId ? { ...thread, unread: false } : thread,
      ),
    );
  }, [route.params?.threadId, activeThreadId, threads]);

  const historyEntries = React.useMemo(
    () => threads.map((thread) => buildHistoryEntry(thread)),
    [threads],
  );

  const activeThread = React.useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) ?? null,
    [threads, activeThreadId],
  );

  const handleSelectHistory = React.useCallback(
    (entry: ChatHistoryEntry) => {
      setActiveThreadId(entry.id);
      navigation.setParams({ threadId: entry.id, createNew: undefined });
      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === entry.id ? { ...thread, unread: false } : thread,
        ),
      );
    },
    [navigation],
  );

  const handleStartNewChat = React.useCallback(() => {
    const now = new Date();
    const newId = `thread-${now.getTime()}`;
    const greeting: ChatMessage = {
      id: `msg-${now.getTime()}`,
      author: "assistant",
      text: "こんにちは！今日はどのようなご相談でしょうか？",
      createdAt: formatTime(now),
    };

    setThreads((prev) => {
      const nextIndex = prev.length + 1;
      const newThread: ChatThread = {
        id: newId,
        title: `新しい質問 ${nextIndex}`,
        messages: [greeting],
      };
      return [...prev, newThread];
    });

    setActiveThreadId(newId);
    navigation.setParams({ threadId: newId, createNew: undefined });
  }, [navigation]);

  const handleSendMessage = React.useCallback(
    (text: string) => {
      if (!activeThreadId) {
        return;
      }

      const now = new Date();
      const message: ChatMessage = {
        id: `msg-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
        author: "user",
        text,
        createdAt: formatTime(now),
      };

      const placeholderId = `pending-${now.getTime()}`;
      const placeholderMessage: ChatMessage = {
        id: placeholderId,
        author: "assistant",
        text: "考え中・・・",
        createdAt: formatTime(now),
        pending: true,
      };

      const targetThreadId = activeThreadId;

      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === targetThreadId
            ? {
                ...thread,
                unread: false,
                messages: [...thread.messages, message, placeholderMessage],
              }
            : thread,
        ),
      );

      const replyDelay = 1200;
      const responseText = `ご入力ありがとうございます。「${text}」について整理します。`;

      const timeoutId = setTimeout(() => {
        const responseTime = formatTime(new Date());
        setThreads((prev) =>
          prev.map((thread) => {
            if (thread.id !== targetThreadId) {
              return thread;
            }
            const nextMessages = thread.messages.map((msg) =>
              msg.id === placeholderId
                ? {
                    ...msg,
                    text: responseText,
                    createdAt: responseTime,
                    pending: false,
                  }
                : msg,
            );
            return { ...thread, messages: nextMessages };
          }),
        );
        delete pendingReplies.current[placeholderId];
      }, replyDelay);

      pendingReplies.current[placeholderId] = timeoutId;
    },
    [activeThreadId],
  );

  const headerConfig = React.useMemo<HeaderConfig>(() => {
    const actions = (chatHeaderConfig.actions ?? []).map((action) => {
      const label = action.label ?? action.accessibilityLabel;
      if (label === "ホーム") {
        return {
          ...action,
          onPress: () => navigation.navigate("Home"),
        };
      }
      return { ...action };
    });

    return {
      ...chatHeaderConfig,
      actions,
    };
  }, [navigation]);

  React.useEffect(() => {
    if (!route.params?.createNew) {
      return;
    }
    navigation.setParams({ createNew: undefined });
    handleStartNewChat();
  }, [handleStartNewChat, navigation, route.params?.createNew]);

  React.useEffect(() => {
    return () => {
      Object.values(pendingReplies.current).forEach((timeoutId) => clearTimeout(timeoutId));
      pendingReplies.current = {};
    };
  }, []);

  const keyboardVerticalOffset = React.useMemo(() => {
    const headerAllowance = 96;
    return insets.top + headerAllowance;
  }, [insets.top]);

  return (
    <PageShell
      headerConfig={headerConfig}
      rightActionVariant="home"
      contentStyle={styles.shellContent}
      drawer={
        <HistoryDrawer
          entries={historyEntries}
          activeId={activeThreadId}
          onSelect={handleSelectHistory}
        />
      }
      drawerWidth={320}
      onCreateNewChat={handleStartNewChat}
    >
      <KeyboardAvoidingView
        style={styles.chatFlexBox}
        behavior={Platform.OS === "ios" ? "padding" : "position"}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <ChatMainArea
          messages={activeThread?.messages ?? []}
          onSendMessage={handleSendMessage}
        />
      </KeyboardAvoidingView>
    </PageShell>
  );
};

const styles = StyleSheet.create({
  shellContent: {
    flex: 1,
  },
  chatFlexBox: {
    flex: 1,
    width: "100%",
  },
});

export default Chat;

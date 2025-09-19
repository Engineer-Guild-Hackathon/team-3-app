import * as React from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ChatMainArea from "../components/ChatMainArea";
import HistoryDrawer from "../components/HistoryDrawer";
import PageShell from "../components/PageShell";
import { chatHeaderConfig } from "../components/headerConfigs";
import { HEADER_ACTION_IDS } from "../components/headerConstants";
import type { HeaderConfig } from "../components/headerTypes";
import type { ChatHistoryEntry } from "../components/types";
import type { RootStackParamList } from "../navigation/types";
import { useChatStore } from "../contexts/chatStore";
import { useAuth } from "../contexts/auth";

const HEADER_HEIGHT_PADDING = 96;

type ChatScreenProps = NativeStackScreenProps<RootStackParamList, "Chat">;

const Chat = ({ navigation, route }: ChatScreenProps) => {
  const insets = useSafeAreaInsets();
  const { threads, histories, ensureMessages, sendMessage, createThread } = useChatStore();
  const { isAuthenticated, login, statusMessage } = useAuth();

  const [activeThreadId, setActiveThreadId] = React.useState<string>(
    () => route.params?.threadId ?? threads[0]?.id ?? "",
  );

  const activeThread = React.useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) ?? null,
    [threads, activeThreadId],
  );

  React.useEffect(() => {
    const target = route.params?.threadId;
    if (target && target !== activeThreadId) {
      setActiveThreadId(target);
    }
  }, [route.params?.threadId, activeThreadId]);

  const startNewChat = React.useCallback(async (): Promise<string | null> => {
    if (!isAuthenticated) {
      await login();
      return null;
    }
    const created = await createThread();
    if (!created) {
      return null;
    }
    setActiveThreadId(created.id);
    navigation.setParams({ threadId: created.id });
    return created.id;
  }, [createThread, isAuthenticated, login, navigation]);

  React.useEffect(() => {
    if (!route.params?.createNew) {
      return;
    }
    navigation.setParams({ createNew: undefined });
    void startNewChat();
  }, [navigation, route.params?.createNew, startNewChat]);

  React.useEffect(() => {
    if (!activeThreadId) {
      return;
    }
    void ensureMessages(activeThreadId);
  }, [activeThreadId, ensureMessages]);

  const handleSelectHistory = React.useCallback(
    (entry: ChatHistoryEntry) => {
      setActiveThreadId(entry.id);
      navigation.setParams({ threadId: entry.id, createNew: undefined });
    },
    [navigation],
  );

  const handleStartNewChat = React.useCallback(() => {
    void startNewChat();
  }, [startNewChat]);

  const handleSendMessage = React.useCallback(
    (text: string) => {
      void (async () => {
        let targetId = activeThreadId;
        if (!targetId) {
          const createdId = await startNewChat();
          if (!createdId) {
            return;
          }
          targetId = createdId;
        }
        if (!isAuthenticated) {
          await login();
          return;
        }
        await sendMessage(targetId, text);
      })();
    },
    [activeThreadId, isAuthenticated, login, sendMessage, startNewChat],
  );

  const headerConfig = React.useMemo<HeaderConfig>(() => {
    const actions = (chatHeaderConfig.actions ?? []).map((action) => {
      if (action.actionId === HEADER_ACTION_IDS.navigateHome) {
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

  const keyboardVerticalOffset = React.useMemo(() => {
    if (Platform.OS === "ios") {
      return insets.top + HEADER_HEIGHT_PADDING;
    }
    return Math.max(insets.bottom, 12);
  }, [insets.bottom, insets.top]);

  const keyboardBehavior = React.useMemo(() => {
    if (Platform.OS === "ios") {
      return "padding" as const;
    }
    return "height" as const;
  }, []);

  return (
    <PageShell
      headerConfig={headerConfig}
      rightActionVariant="home"
      contentStyle={styles.shellContent}
      drawer={
        <HistoryDrawer
          entries={histories}
          activeId={activeThreadId}
          onSelect={handleSelectHistory}
          onCreatePress={handleStartNewChat}
        />
      }
      drawerWidth={320}
      onCreateNewChat={handleStartNewChat}
    >
      <KeyboardAvoidingView
        style={styles.chatFlexBox}
        behavior={keyboardBehavior}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <ChatMainArea
          messages={activeThread?.messages ?? []}
          onSendMessage={handleSendMessage}
        />
        {statusMessage ? <Text style={styles.statusText}>{statusMessage}</Text> : null}
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
    paddingBottom: 16,
    gap: 8,
  },
  statusText: {
    alignSelf: "center",
    fontSize: 13,
    color: "#475569",
  },
});

export default Chat;

import * as React from "react";
import { KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ChatMainArea from "../components/ChatMainArea";
import HistoryDrawer from "../components/HistoryDrawer";
import PageShell from "../components/PageShell";
import { chatHeaderConfig } from "../components/headerConfigs";
import { HEADER_ACTION_IDS } from "../components/headerConstants";
import type { HeaderConfig } from "../components/headerTypes";
import type { ChatHistoryEntry, ChatMessage, ChatThread } from "../components/types";
import type { RootStackParamList } from "../navigation/types";
import { buildHistoryEntry } from "../utils/chatHistory";
import { nowAsIsoString } from "../utils/datetime";
import { useChatStore } from "../contexts/chatStore";

type ChatScreenProps = NativeStackScreenProps<RootStackParamList, "Chat">;

// 応答のディレイ時間（ミリ秒）を定数化しておき、数値の意図を明確化
const REPLY_DELAY_MS = 1200;

// pendingReplies の構造を型として切り出し、参照箇所での把握を容易にする
type PendingReplyTimers = Record<string, ReturnType<typeof setTimeout>>;

const Chat = ({ navigation, route }: ChatScreenProps) => {
  const insets = useSafeAreaInsets();
  const { threads, setThreads } = useChatStore();
  const [activeThreadId, setActiveThreadId] = React.useState<string>(
    () => route.params?.threadId ?? threads[0]?.id ?? "",
  );
  // 擬似的な返信タスクを追跡し、画面離脱時にクリーンアップするための参照
  const pendingReplies = React.useRef<PendingReplyTimers>({});

  // 指定したスレッドだけを更新する共通処理。各所での map 重複を減らす。
  const applyThreadUpdate = React.useCallback(
    (targetId: string, updater: (thread: ChatThread) => ChatThread) => {
      setThreads((prev) =>
        prev.map((thread) => (thread.id === targetId ? updater(thread) : thread)),
      );
    },
    [setThreads],
  );

  // 既読化のみを行うユーティリティ。読み取り性の高い名前にする。
  const markThreadRead = React.useCallback(
    (targetId: string) => {
      applyThreadUpdate(targetId, (thread) => ({ ...thread, unread: false }));
    },
    [applyThreadUpdate],
  );

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
    markThreadRead(targetId);
  }, [route.params?.threadId, activeThreadId, threads, markThreadRead]);

  // 履歴カードに渡すためのサマリー情報を事前計算して再利用
  const historyEntries = React.useMemo(
    () => threads.map((thread) => buildHistoryEntry(thread)),
    [threads],
  );

  // 現在アクティブなスレッドを都度検索するコストを削減
  const activeThread = React.useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) ?? null,
    [threads, activeThreadId],
  );

  // 履歴カードからの選択でスレッドを切り替え、未読状態を解消
  const handleSelectHistory = React.useCallback(
    (entry: ChatHistoryEntry) => {
      setActiveThreadId(entry.id);
      navigation.setParams({ threadId: entry.id, createNew: undefined });
      markThreadRead(entry.id);
    },
    [navigation, markThreadRead],
  );

  // 「新しい質問」操作で初期メッセージ付きのスレッドを生成
  const handleStartNewChat = React.useCallback(() => {
    const now = new Date();
    const newId = `thread-${now.getTime()}`;
    const createdAt = now.toISOString();
    const greeting: ChatMessage = {
      id: `msg-${now.getTime()}`,
      author: "assistant",
      text: "こんにちは！今日はどのようなご相談でしょうか？",
      createdAt,
      status: -1 as const,
    };

    setThreads((prev) => {
      const nextIndex = prev.length + 1;
      const newThread: ChatThread = {
        id: newId,
        title: `新しい質問 ${nextIndex}`,
        messages: [greeting],
        unread: false,
      };
      return [...prev, newThread];
    });

    setActiveThreadId(newId);
    navigation.setParams({ threadId: newId, createNew: undefined });
  }, [navigation]);

  // メッセージ送信時のスレッド更新と疑似返信管理を一箇所で実施
  const handleSendMessage = React.useCallback(
    (text: string) => {
      if (!activeThreadId) {
        return;
      }

      const now = new Date();
      const createdAt = now.toISOString();
      const message: ChatMessage = {
        id: `msg-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
        author: "user",
        text,
        createdAt,
      };

      const placeholderId = `pending-${now.getTime()}`;
      const placeholderMessage: ChatMessage = {
        id: placeholderId,
        author: "assistant",
        text: "考え中・・・",
        createdAt,
        pending: true,
        status: -1 as const,
      };

      const targetThreadId = activeThreadId;

      // ユーザー投稿とプレースホルダーを同時に追加し、未読フラグを解除
      applyThreadUpdate(targetThreadId, (thread) => ({
        ...thread,
        unread: false,
        messages: [...thread.messages, message, placeholderMessage],
      }));

      const responseText = `ご入力ありがとうございます。「${text}」について整理します。`;

      const timeoutId = setTimeout(() => {
        const responseTime = nowAsIsoString();
        applyThreadUpdate(targetThreadId, (thread) => ({
          ...thread,
          messages: thread.messages.map((msg) =>
            msg.id === placeholderId
              ? {
                  ...msg,
                  text: responseText,
                  createdAt: responseTime,
                  pending: false,
                  status: -1 as const,
                }
              : msg,
          ),
        }));
        delete pendingReplies.current[placeholderId];
      }, REPLY_DELAY_MS);

      pendingReplies.current[placeholderId] = timeoutId;
    },
    [activeThreadId, applyThreadUpdate],
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

  // Home 画面から「新規作成」で遷移した場合の初期化処理
  React.useEffect(() => {
    if (!route.params?.createNew) {
      return;
    }
    navigation.setParams({ createNew: undefined });
    handleStartNewChat();
  }, [handleStartNewChat, navigation, route.params?.createNew]);

  // コンポーネント破棄時にタイマーを全て解除してメモリリークを防止
  React.useEffect(() => {
    return () => {
      Object.values(pendingReplies.current).forEach((timeoutId) => clearTimeout(timeoutId));
      pendingReplies.current = {};
    };
  }, []);

  // ヘッダー高さを考慮した KeyboardAvoidingView 用のオフセットを算出
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

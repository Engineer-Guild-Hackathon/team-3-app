import * as React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Gap, Padding, Color } from "../GlobalStyles";
import ChatArea, { type ChatAreaHandle } from "./ChatArea";
import InputArea, { type InputAreaStatus } from "./InputArea";
import type { ChatMessage } from "./types";
import { getLatestAssistantStatus } from "../utils/status";

export type ChatMainAreaProps = {
  messages?: ChatMessage[];
  onSendMessage?: (text: string) => void;
  inputStatus?: InputAreaStatus;
};

const ChatMainArea = ({
  messages = [],
  onSendMessage,
  inputStatus,
}: ChatMainAreaProps) => {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = React.useState("");
  const inputContainerStyle = React.useMemo(
    () => [styles.inputContainer, { paddingBottom: Padding.p_18 + insets.bottom }],
    [insets.bottom],
  );
  const chatAreaRef = React.useRef<ChatAreaHandle>(null);
  const [isChatAtBottom, setIsChatAtBottom] = React.useState(true);
  // 最新メッセージまでスクロールする汎用処理を集約
  const scrollToLatest = React.useCallback(() => {
    chatAreaRef.current?.scrollToEnd({ animated: true });
  }, []);
  const ensureLatestVisible = React.useCallback(() => {
    requestAnimationFrame(scrollToLatest);
    setTimeout(scrollToLatest, 180);
  }, [scrollToLatest]);
  // アシスタント側に保留中メッセージが存在するかをキャッシュ
  const hasPendingAssistant = React.useMemo(
    () =>
      messages.some(
        (message) => message.author === "assistant" && message.pending,
      ),
    [messages],
  );
  const assistantStatus = React.useMemo(
    () => getLatestAssistantStatus(messages),
    [messages],
  );
  // 入力欄の状態を会話の進行状況から自動判定
  const resolvedStatus: InputAreaStatus = React.useMemo(() => {
    if (inputStatus) {
      return inputStatus;
    }
    if (hasPendingAssistant) {
      return "waiting";
    }
    if (assistantStatus === 0 || assistantStatus === 1) {
      return "completed";
    }
    return "default";
  }, [assistantStatus, hasPendingAssistant, inputStatus]);

  // 送信後に入力中テキストをリセットしてから親へ通知
  const handleSend = (text: string) => {
    setDraft("");
    onSendMessage?.(text);
  };

  React.useEffect(() => {
    if (resolvedStatus !== "default") {
      setDraft("");
    }
  }, [resolvedStatus]);

  // スクロール位置の情報を ChatArea から受け取り最下部かどうかを保持
  const handleChatBottomStateChange = React.useCallback((atBottom: boolean) => {
    setIsChatAtBottom(atBottom);
  }, []);

  // 最下部を表示中のみフォーカス時に最新メッセージへスクロール
  const handleInputFocus = React.useCallback(() => {
    if (!isChatAtBottom) {
      return;
    }
    ensureLatestVisible();
  }, [ensureLatestVisible, isChatAtBottom]);

  return (
    <View style={styles.container}>
      <View style={styles.messages}>
        <View style={styles.chatArea}>
          <ChatArea
            ref={chatAreaRef}
            messages={messages}
            onBottomStateChange={handleChatBottomStateChange}
          />
        </View>
      </View>
      <View style={inputContainerStyle}>
        <InputArea
          value={draft}
          onChangeText={setDraft}
          onSend={handleSend}
          status={resolvedStatus}
          onFocus={handleInputFocus}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignSelf: "stretch",
  },
  messages: {
    flex: 1,
    paddingBottom: Gap.gap_10,
  },
  chatArea: {
    flex: 1,
  },
  inputContainer: {
    paddingHorizontal: Padding.p_24,
    paddingTop: Gap.gap_10,
    backgroundColor: Color.colorGray100,
  },
});

export default React.memo(ChatMainArea);

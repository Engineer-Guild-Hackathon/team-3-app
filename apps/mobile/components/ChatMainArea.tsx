import * as React from "react";
import { StyleSheet, View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Gap,
  Padding,
  Color,
  FontSize,
  FontFamily,
  StyleVariable,
} from "../GlobalStyles";
import ChatArea, { type ChatAreaHandle } from "./ChatArea";
import InputArea, { type InputAreaStatus } from "./InputArea";
import type { ChatMessage } from "./types";
import { ASSISTANT_STATUS_META, getLatestAssistantStatus } from "../utils/status";

export type ChatMainAreaProps = {
  messages?: ChatMessage[];
  onSendMessage?: (text: string) => void;
  inputStatus?: InputAreaStatus;
  subjectLabel?: string | null;
  topicLabel?: string | null;
};

const ChatMainArea = ({
  messages = [],
  onSendMessage,
  inputStatus,
  subjectLabel,
  topicLabel,
}: ChatMainAreaProps) => {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = React.useState("");
  const inputContainerStyle = React.useMemo(
    () => [
      styles.inputContainer,
      { paddingBottom: Math.max(12, insets.bottom + 8) },
    ],
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
  const statusMeta = assistantStatus != null ? ASSISTANT_STATUS_META[assistantStatus] : undefined;
  const resolvedSubject = subjectLabel ?? "未設定";
  const resolvedTopic = topicLabel ?? "未設定";
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
        <View style={styles.infoWrapper}>
          <View style={styles.infoCard}>
            <View style={styles.infoHeaderRow}>
              <Text style={styles.title}>Student AI</Text>
              {statusMeta ? (
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: statusMeta.badgeBackground,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: statusMeta.badgeText },
                    ]}
                  />
                  <Text style={[styles.statusText, { color: statusMeta.badgeText }]}>
                    {statusMeta.label}
                  </Text>
                </View>
              ) : null}
            </View>
            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <Text style={styles.metaLabel}>教科</Text>
                <Text style={styles.metaValue}>{resolvedSubject}</Text>
              </View>
              <View style={styles.metaChip}>
                <Text style={styles.metaLabel}>分野</Text>
                <Text style={styles.metaValue}>{resolvedTopic}</Text>
              </View>
            </View>
          </View>
        </View>
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
    paddingTop: Gap.gap_6,
    marginTop: Gap.gap_10,
    backgroundColor: Color.colorGray100,
  },
  infoWrapper: {
    paddingHorizontal: Padding.p_18,
    paddingTop: 10,
    paddingBottom: Gap.gap_8,
  },
  infoCard: {
    borderRadius: StyleVariable.radiusLg,
    backgroundColor: "rgba(248, 251, 255, 0.96)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(148, 163, 184, 0.25)",
    paddingVertical: 12,
    paddingHorizontal: Padding.p_18,
    shadowColor: "rgba(15, 23, 42, 0.08)",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    shadowOpacity: 1,
    elevation: 5,
    gap: Gap.gap_6,
  },
  infoHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 16,
    lineHeight: 24,
    color: Color.colorTextPrimary,
    fontFamily: FontFamily.notoSansJPRegular,
  },
  statusBadge: {
    marginLeft: StyleVariable.spaceSm,
    paddingHorizontal: StyleVariable.spaceMd,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: StyleVariable.space4,
    shadowColor: "rgba(15, 23, 42, 0.15)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Color.colorBrandPrimary,
  },
  statusText: {
    fontSize: 11,
    fontFamily: FontFamily.notoSansJPRegular,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: StyleVariable.spaceSm,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: StyleVariable.spaceMd,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(148, 163, 184, 0.16)",
    gap: Gap.gap_4,
  },
  metaLabel: {
    fontSize: 10,
    color: Color.colorTextSecondary,
    fontFamily: FontFamily.notoSansJPRegular,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  metaValue: {
    fontSize: 12,
    color: Color.colorTextPrimary,
    fontFamily: FontFamily.notoSansJPRegular,
    fontWeight: "600",
  },
});

export default React.memo(ChatMainArea);

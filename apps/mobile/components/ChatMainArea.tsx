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
                      borderColor: statusMeta.badgeBorder,
                    },
                  ]}
                >
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
    paddingTop: Gap.gap_10,
    backgroundColor: Color.colorGray100,
  },
  infoWrapper: {
    paddingHorizontal: Padding.p_24,
    paddingTop: Padding.p_18,
    paddingBottom: Gap.gap_10,
  },
  infoCard: {
    borderRadius: StyleVariable.radiusLg,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(148, 163, 184, 0.35)",
    paddingVertical: Padding.p_18,
    paddingHorizontal: Padding.p_24,
    shadowColor: "rgba(15, 23, 42, 0.12)",
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 24,
    shadowOpacity: 1,
    elevation: 8,
    gap: Gap.gap_10,
  },
  infoHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: FontSize.size_18,
    lineHeight: 26,
    color: Color.colorTextPrimary,
    fontFamily: FontFamily.notoSansJPRegular,
  },
  statusBadge: {
    marginLeft: StyleVariable.spaceMd,
    paddingHorizontal: StyleVariable.spaceSm,
    paddingVertical: StyleVariable.space4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statusText: {
    fontSize: 12,
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
    paddingHorizontal: StyleVariable.spaceSm,
    paddingVertical: StyleVariable.space4,
    borderRadius: StyleVariable.radiusMd,
    backgroundColor: Color.highlightLightest,
    gap: Gap.gap_4,
  },
  metaLabel: {
    fontSize: 12,
    color: Color.colorTextSecondary,
    fontFamily: FontFamily.notoSansJPRegular,
  },
  metaValue: {
    fontSize: 13,
    color: Color.colorTextPrimary,
    fontFamily: FontFamily.notoSansJPRegular,
    fontWeight: "600",
  },
});

export default React.memo(ChatMainArea);

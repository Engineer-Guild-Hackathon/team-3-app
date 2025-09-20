import * as React from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  FontFamily,
  Color,
  Padding,
  FontSize,
  StyleVariable,
} from "../GlobalStyles";
import { formatBubbleTimestamp } from "../utils/datetime";
import type { ChatMessage } from "./types";

export type ChatBubbleProps = {
  message: ChatMessage;
};

const ChatBubble = ({ message }: ChatBubbleProps) => {
  const { author, text, pending, createdAt } = message;
  // 投稿者種別によって配置や色を切り替え
  const isUser = author === "user";
  // タイムスタンプを人が読みやすい形式へ変換
  const timestampLabel = React.useMemo(
    () => formatBubbleTimestamp(createdAt),
    [createdAt],
  );
  // スタイル配列を useMemo 化して再描画時の差分計算を抑制
  const containerStyle = React.useMemo(
    () => [styles.container, isUser ? styles.containerRight : styles.containerLeft],
    [isUser],
  );
  const bubbleStyle = React.useMemo(
    () => [styles.bubble, isUser ? styles.userBubble : styles.assistantBubble],
    [isUser],
  );
  const textStyle = React.useMemo(
    () => [styles.text, isUser ? styles.userText : styles.assistantText, pending ? styles.pendingText : null],
    [isUser, pending],
  );

  return (
    <View style={containerStyle}>
      <View style={bubbleStyle}>
        <Text style={textStyle}>{text}</Text>
      </View>
      <Text style={styles.timestamp}>{timestampLabel}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: "80%",
    alignSelf: "flex-start",
    gap: StyleVariable.space4,
  },
  containerRight: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  containerLeft: {
    alignItems: "flex-start",
  },
  bubble: {
    paddingHorizontal: Padding.p_24,
    paddingVertical: 12,
    borderRadius: StyleVariable.radiusLg,
  },
  userBubble: {
    backgroundColor: Color.colorBrandPrimary,
  },
  assistantBubble: {
    backgroundColor: Color.colorRoleAssistant,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: FontFamily.notoSansJPRegular,
  },
  userText: {
    color: Color.colorWhite,
    textAlign: "left",
  },
  assistantText: {
    color: Color.colorTextPrimary,
  },
  pendingText: {
    color: Color.colorDimgray,
  },
  timestamp: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FontFamily.notoSansJPRegular,
    color: Color.colorDimgray,
  },
});

export default React.memo(ChatBubble);

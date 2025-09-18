import * as React from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  FontFamily,
  Color,
  Padding,
  FontSize,
  StyleVariable,
} from "../GlobalStyles";
import type { ChatMessage } from "./types";

export type ChatBubbleProps = {
  message: ChatMessage;
};

const ChatBubble = ({ message }: ChatBubbleProps) => {
  const isUser = message.author === "user";

  return (
    <View style={[styles.container, isUser ? styles.containerRight : styles.containerLeft]}>
      <View
        style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}
      >
        <Text style={[styles.text, isUser ? styles.userText : styles.assistantText]}>
          {message.text}
        </Text>
      </View>
      <Text style={styles.timestamp}>{message.createdAt}</Text>
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
    paddingHorizontal: Padding.p_18,
    paddingVertical: Padding.p_10,
    borderRadius: StyleVariable.radiusLg,
  },
  userBubble: {
    backgroundColor: Color.colorBrandPrimary,
  },
  assistantBubble: {
    backgroundColor: Color.colorRoleAssistant,
  },
  text: {
    fontSize: FontSize.size_18,
    lineHeight: 28,
    fontFamily: FontFamily.notoSansJPRegular,
  },
  userText: {
    color: Color.colorWhite,
    textAlign: "left",
  },
  assistantText: {
    color: Color.colorTextPrimary,
  },
  timestamp: {
    fontSize: FontSize.size_14,
    lineHeight: 22,
    fontFamily: FontFamily.notoSansJPRegular,
    color: Color.colorDimgray,
  },
});

export default React.memo(ChatBubble);

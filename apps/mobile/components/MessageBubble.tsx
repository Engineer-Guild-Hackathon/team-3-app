import * as React from "react";
import { StyleSheet, View } from "react-native";

import { StyleVariable } from "../GlobalStyles";
import Avatar from "./Avatar";
import ChatBubble from "./ChatBubble";
import type { ChatMessage } from "./types";

export type MessageBubbleProps = {
  message: ChatMessage;
  showAvatar?: boolean;
};

const MessageBubble = ({ message, showAvatar = message.author === "assistant" }: MessageBubbleProps) => {
  const isUser = message.author === "user";

  return (
    <View style={[styles.root, isUser ? styles.rootRight : styles.rootLeft]}>
      {showAvatar ? (
        <Avatar size={32} style={styles.avatar} />
      ) : (
        <View style={styles.avatarSpacer} />
      )}
      <ChatBubble message={message} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "flex-end",
    gap: StyleVariable.spaceMd,
  },
  rootRight: {
    flexDirection: "row-reverse",
  },
  rootLeft: {
    flexDirection: "row",
  },
  avatar: {
    marginBottom: 8,
  },
  avatarSpacer: {
    width: 32,
  },
});

export default React.memo(MessageBubble);

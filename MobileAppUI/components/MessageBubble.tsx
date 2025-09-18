import * as React from "react";
import { StyleSheet, View } from "react-native";
import Avatar1 from "./Avatar1";
import ChatBubble from "./ChatBubble";

const MessageBubble = () => {
  return (
    <View style={styles.root}>
      <Avatar1 />
      <ChatBubble
        color="Blue"
        mode="Recent"
        side="Left"
        theme="Dark"
        text="Te-to-Te wo tsunaide"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    alignSelf: "stretch",
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "flex-end",
  },
});

export default MessageBubble;

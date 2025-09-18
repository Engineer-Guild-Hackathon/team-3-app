import * as React from "react";
import { StyleSheet, View } from "react-native";

import { Gap, Padding, Color } from "../GlobalStyles";
import ChatArea from "./ChatArea";
import InputArea from "./InputArea";
import type { ChatMessage } from "./types";

export type ChatMainAreaProps = {
  messages?: ChatMessage[];
  onSendMessage?: (text: string) => void;
};

const ChatMainArea = ({ messages = [], onSendMessage }: ChatMainAreaProps) => {
  const [draft, setDraft] = React.useState("");

  const handleSend = (text: string) => {
    onSendMessage?.(text);
    setDraft("");
  };

  return (
    <View style={styles.container}>
      <View style={styles.messages}>
        <ChatArea messages={messages} />
      </View>
      <View style={styles.inputContainer}>
        <InputArea value={draft} onChangeText={setDraft} onSend={handleSend} />
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
  inputContainer: {
    paddingHorizontal: Padding.p_24,
    paddingBottom: Padding.p_18,
    paddingTop: Gap.gap_10,
    backgroundColor: Color.colorGray100,
  },
});

export default React.memo(ChatMainArea);

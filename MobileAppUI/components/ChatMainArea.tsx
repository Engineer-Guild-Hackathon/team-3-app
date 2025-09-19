import * as React from "react";
import { StyleSheet, View } from "react-native";

import { Gap, Padding, Color } from "../GlobalStyles";
import ChatArea from "./ChatArea";
import InputArea, { type InputAreaStatus } from "./InputArea";
import type { ChatMessage } from "./types";

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
  const [draft, setDraft] = React.useState("");
  const hasPendingAssistant = React.useMemo(
    () =>
      messages.some(
        (message) => message.author === "assistant" && message.pending,
      ),
    [messages],
  );
  const latestAssistantStatus = React.useMemo<-1 | 0 | 1 | null>(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const candidate = messages[index];
      if (candidate.author !== "assistant" || candidate.pending) {
        continue;
      }
      return candidate.status ?? null;
    }
    return null;
  }, [messages]);
  const resolvedStatus: InputAreaStatus = React.useMemo(() => {
    if (inputStatus) {
      return inputStatus;
    }
    if (hasPendingAssistant) {
      return "waiting";
    }
    if (latestAssistantStatus === 0 || latestAssistantStatus === 1) {
      return "completed";
    }
    return "default";
  }, [hasPendingAssistant, inputStatus, latestAssistantStatus]);

  const handleSend = (text: string) => {
    setDraft("");
    onSendMessage?.(text);
  };

  React.useEffect(() => {
    if (resolvedStatus !== "default") {
      setDraft("");
    }
  }, [resolvedStatus]);

  return (
    <View style={styles.container}>
      <View style={styles.messages}>
        <ChatArea messages={messages} />
      </View>
      <View style={styles.inputContainer}>
        <InputArea
          value={draft}
          onChangeText={setDraft}
          onSend={handleSend}
          status={resolvedStatus}
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
  inputContainer: {
    paddingHorizontal: Padding.p_24,
    paddingBottom: Padding.p_18,
    paddingTop: Gap.gap_10,
    backgroundColor: Color.colorGray100,
  },
});

export default React.memo(ChatMainArea);

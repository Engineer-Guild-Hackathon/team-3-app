import * as React from "react";
import { FlatList, ListRenderItem, StyleSheet, View } from "react-native";

import { Gap, Padding, Color } from "../GlobalStyles";
import InputArea from "./InputArea";
import MessageBubble from "./MessageBubble";
import type { ChatMessage } from "./types";

export type ChatMainAreaProps = {
  messages?: ChatMessage[];
  onSendMessage?: (text: string) => void;
};

const FALLBACK_MESSAGES: ChatMessage[] = [
  { id: "m1", author: "assistant", text: "ご相談ありがとうございます。", createdAt: "12:00" },
  { id: "m2", author: "user", text: "レポートをまとめてください。", createdAt: "12:01" },
  { id: "m3", author: "assistant", text: "承知しました。ポイントはどこでしょうか？", createdAt: "12:02" },
];

const ChatMainArea = ({ messages = [], onSendMessage }: ChatMainAreaProps) => {
  const [draft, setDraft] = React.useState("");
  const listRef = React.useRef<FlatList<ChatMessage>>(null);

  const data = messages.length > 0 ? messages : FALLBACK_MESSAGES;

  React.useEffect(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, [data.length]);

  const handleSend = (text: string) => {
    onSendMessage?.(text);
    setDraft("");
  };

  const renderItem: ListRenderItem<ChatMessage> = ({ item }) => (
    <MessageBubble message={item} />
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.messageContainer}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
      />
      <View style={styles.inputContainer}>
        <InputArea
          value={draft}
          onChangeText={setDraft}
          onSend={handleSend}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: Gap.gap_10,
    alignSelf: "stretch",
  },
  messageContainer: {
    paddingHorizontal: Padding.p_24,
    paddingVertical: Padding.p_18,
    gap: Gap.gap_10,
  },
  separator: {
    height: Gap.gap_10,
  },
  inputContainer: {
    paddingHorizontal: Padding.p_24,
    paddingBottom: Padding.p_18,
    backgroundColor: Color.colorGray100,
  },
});

export default React.memo(ChatMainArea);

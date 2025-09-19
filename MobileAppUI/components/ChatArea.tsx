import * as React from "react";
import { FlatList, ListRenderItem, StyleSheet, View } from "react-native";

import { Gap, Padding } from "../GlobalStyles";
import ChatBubble from "./ChatBubble";
import type { ChatMessage } from "./types";

export type ChatAreaProps = {
  messages?: ChatMessage[];
};

const FALLBACK_MESSAGES: ChatMessage[] = [
  { id: "m1", author: "assistant", text: "ご相談ありがとうございます。", status: -1, createdAt: "12:00" },
  { id: "m2", author: "user", text: "レポートをまとめてください。", createdAt: "12:01" },
  { id: "m3", author: "assistant", text: "承知しました。ポイントはどこでしょうか？", status: -1, createdAt: "12:02" },
];

const ChatArea = ({ messages = [] }: ChatAreaProps) => {
  const listRef = React.useRef<FlatList<ChatMessage>>(null);

  const data = messages.length > 0 ? messages : FALLBACK_MESSAGES;

  const lastMessageKey = React.useMemo(() => {
    if (data.length === 0) {
      return "empty";
    }
    const last = data[data.length - 1];
    const pendingKey = last.pending ? "pending" : "done";
    const statusKey = last.status ?? "unknown";
    return `${last.id}|${last.text}|${pendingKey}|${statusKey}`;
  }, [data]);

  React.useEffect(() => {
    const frame = requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
    const timeout = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 180);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
    };
  }, [lastMessageKey]);

  const renderItem = React.useCallback<ListRenderItem<ChatMessage>>(
    ({ item }) => (
      <View style={styles.itemContainer}>
        <ChatBubble message={item} />
      </View>
    ),
    [],
  );

  return (
    <FlatList
      ref={listRef}
      data={data}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      style={styles.list}
      contentContainerStyle={styles.messageContainer}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListFooterComponent={<View style={styles.footerSpacer} />}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  messageContainer: {
    paddingHorizontal: Padding.p_24,
    paddingVertical: Padding.p_18,
  },
  itemContainer: {
    alignSelf: "stretch",
  },
  separator: {
    height: Gap.gap_10,
  },
  footerSpacer: {
    height: Padding.p_24,
  },
});

export default React.memo(ChatArea);

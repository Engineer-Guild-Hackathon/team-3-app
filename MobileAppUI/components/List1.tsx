import * as React from "react";
import { StyleSheet, View } from "react-native";

import Item from "./Item";
import type { ChatHistoryEntry } from "./types";

export type List1Props = {
  entries: ChatHistoryEntry[];
  activeId?: string;
  onSelect?: (entry: ChatHistoryEntry) => void;
};

const FALLBACK_ENTRIES: ChatHistoryEntry[] = [
  { id: "1", title: "最近の質問", snippet: "チャットの流れを教えて" , timestamp: "12:30", unread: true },
  { id: "2", title: "AI 相談", snippet: "分析レポートをまとめて" , timestamp: "12:08" },
  { id: "3", title: "設計レビュー", snippet: "画面遷移について" , timestamp: "昨日" },
];

const List1 = ({ entries, activeId, onSelect }: List1Props) => {
  const data = entries.length > 0 ? entries : FALLBACK_ENTRIES;

  return (
    <View style={styles.contentContainer}>
      {data.map((item, index) => (
        <React.Fragment key={item.id}>
          <Item
            {...item}
            isActive={item.id === activeId}
            onPress={() => onSelect?.(item)}
          />
          {index < data.length - 1 ? <View style={styles.separator} /> : null}
        </React.Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  separator: {
    height: 8,
  },
});

export default React.memo(List1);

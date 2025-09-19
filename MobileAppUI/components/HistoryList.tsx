import * as React from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import HistoryItem from "./HistoryItem";
import type { ChatHistoryEntry } from "./types";

export type HistoryListProps = {
  entries: ChatHistoryEntry[];
  activeId?: string;
  onSelect?: (entry: ChatHistoryEntry) => void;
};

const FALLBACK_ENTRIES: ChatHistoryEntry[] = [
  {
    id: "1",
    title: "最近の質問",
    snippet: "チャットの流れを教えて",
    timestamp: "12:30",
    unread: true,
    lastAssistantStatus: -1,
  },
  {
    id: "2",
    title: "AI 相談",
    snippet: "分析レポートをまとめて",
    timestamp: "12:08",
  },
  {
    id: "3",
    title: "設計レビュー",
    snippet: "画面遷移について",
    timestamp: "昨日",
  },
];

const HistoryList = ({ entries, activeId, onSelect }: HistoryListProps) => {
  const data = entries.length > 0 ? entries : FALLBACK_ENTRIES;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {data.map((item, index) => (
        <React.Fragment key={item.id}>
          <HistoryItem
            {...item}
            isActive={item.id === activeId}
            onPress={() => onSelect?.(item)}
          />
          {index < data.length - 1 ? <View style={styles.separator} /> : null}
        </React.Fragment>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    alignSelf: "stretch",
    flex: 1,
    minHeight: 0,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 16,
    gap: 8,
  },
  separator: {
    height: 8,
  },
});

export default React.memo(HistoryList);

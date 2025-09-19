import * as React from "react";
import { ScrollView, StyleSheet, View, Text } from "react-native";

import HistoryItem from "./HistoryItem";
import type { ChatHistoryEntry } from "./types";

export type HistoryListProps = {
  entries: ChatHistoryEntry[];
  activeId?: string;
  onSelect?: (entry: ChatHistoryEntry) => void;
};

const HistoryList = ({ entries, activeId, onSelect }: HistoryListProps) => {
  const data = entries;
  const handlePress = React.useCallback(
    (entry: ChatHistoryEntry) => () => onSelect?.(entry),
    [onSelect],
  );

  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>履歴はまだありません</Text>
      </View>
    );
  }

  return (
    <ScrollView
      // シンプルな縦スクロールで履歴一覧を提示
      style={styles.scroll}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {data.map((item, index) => (
        <React.Fragment key={item.id}>
          <HistoryItem
            {...item}
            isActive={item.id === activeId}
            onPress={handlePress(item)}
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
    // 項目間の余白を保つスペーサー
    height: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    color: "#64748b",
  },
});

export default React.memo(HistoryList);

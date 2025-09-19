import * as React from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import HistoryItem from "./HistoryItem";
import type { ChatHistoryEntry } from "./types";
import { getSampleHistoryEntries } from "../utils/sampleData";

export type HistoryListProps = {
  entries: ChatHistoryEntry[];
  activeId?: string;
  onSelect?: (entry: ChatHistoryEntry) => void;
};

const HistoryList = ({ entries, activeId, onSelect }: HistoryListProps) => {
  const fallbackEntries = React.useMemo(() => getSampleHistoryEntries(), []);
  const data = entries.length > 0 ? entries : fallbackEntries;

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

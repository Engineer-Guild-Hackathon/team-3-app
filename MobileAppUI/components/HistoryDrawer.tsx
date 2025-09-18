import * as React from "react";
import { StyleSheet, View } from "react-native";

import { StyleVariable, Color } from "../GlobalStyles";
import HistoryCard from "./HistoryCard";
import NewChatButton from "./NewChatButton";
import type { ChatHistoryEntry } from "./types";

export type HistoryDrawerProps = {
  entries?: ChatHistoryEntry[];
  activeId?: string;
  onSelect?: (entry: ChatHistoryEntry) => void;
  onCreatePress?: () => void;
};

const HistoryDrawer = ({
  entries = [],
  activeId,
  onSelect,
  onCreatePress,
}: HistoryDrawerProps) => {
  return (
    <View style={styles.container}>
      <NewChatButton onPress={onCreatePress} />
      <View style={styles.historyArea}>
        <HistoryCard
          entries={entries}
          activeId={activeId}
          onSelect={onSelect}
          heightMode="flex"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    flex: 1,
    borderRadius: StyleVariable.radiusMd,
    backgroundColor: Color.colorHistoryDrawerBackground,
    padding: StyleVariable.spaceLg,
    gap: StyleVariable.spaceMd,
  },
  historyArea: {
    flex: 1,
  },
});

export default React.memo(HistoryDrawer);

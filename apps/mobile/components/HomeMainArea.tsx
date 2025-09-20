import * as React from "react";
import { StyleSheet, View } from "react-native";

import { Gap } from "../GlobalStyles";
import HistoryCard from "./HistoryCard";
import UserInfo from "./UserInfo";
import type { ChatHistoryEntry } from "./types";

export type HomeMainAreaProps = {
  userName?: string;
  historyEntries?: ChatHistoryEntry[];
  activeHistoryId?: string;
  onSelectHistory?: (entry: ChatHistoryEntry) => void;
  onLogout?: () => void;
};

const HomeMainArea = ({
  userName = "UserName",
  historyEntries = [],
  activeHistoryId,
  onSelectHistory,
  onLogout,
}: HomeMainAreaProps) => {
  // ホーム画面中央領域の構成要素をまとめて配置
  return (
    <View style={styles.container}>
      <UserInfo name={userName} onLogout={onLogout} />
      <HistoryCard
        entries={historyEntries}
        activeId={activeHistoryId}
        onSelect={onSelectHistory}
        heightMode="fixed"
        height={420}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Gap.gap_30,
    flex: 1,
    alignSelf: "stretch",
  },
});

export default React.memo(HomeMainArea);

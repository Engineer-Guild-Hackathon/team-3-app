import * as React from "react";
import { StyleSheet, View } from "react-native";

import {
  Gap,
  StyleVariable,
  Color,
} from "../GlobalStyles";
import Card from "./Card";
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
        height={300}
      />
      <Card title="Stats">
        <View style={styles.statsPlaceholder} />
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Gap.gap_30,
    flex: 1,
    alignSelf: "stretch",
  },
  statsPlaceholder: {
    // 統計表示スペースが未実装であることを明示
    height: 156,
    borderRadius: StyleVariable.radiusMd,
    backgroundColor: Color.colorBlack,
  },
});

export default React.memo(HomeMainArea);

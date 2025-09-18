import * as React from "react";
import { ImageBackground, StyleSheet, View } from "react-native";

import { StyleVariable, Color } from "../GlobalStyles";
import ChatMainArea from "./ChatMainArea";
import Header from "./Header";
import HistoryDrawer from "./HistoryDrawer";
import type { ChatHistoryEntry, ChatMessage } from "./types";

const SAMPLE_HISTORY: ChatHistoryEntry[] = [
  { id: "1", title: "最近の質問", snippet: "プロジェクト状況を整理", timestamp: "12:30", unread: true },
  { id: "2", title: "AI 相談", snippet: "課題の洗い出し", timestamp: "12:08" },
  { id: "3", title: "資料レビュー", snippet: "構成の確認", timestamp: "昨日" },
];

const SAMPLE_MESSAGES: ChatMessage[] = [
  { id: "m1", author: "assistant", text: "本日のゴールを教えてください。", createdAt: "12:00" },
  { id: "m2", author: "user", text: "最新のレポートをまとめたいです。", createdAt: "12:01" },
  { id: "m3", author: "assistant", text: "了解しました。必要なデータは揃っていますか？", createdAt: "12:02" },
];

const PageShellIcon = () => {
  return (
    <ImageBackground
      style={styles.shell}
      resizeMode="cover"
      source={require("../assets/Layout-PageShell.png")}
    >
      <Header />
      <View style={styles.body}>
        <View style={styles.chatArea}>
          <ChatMainArea messages={SAMPLE_MESSAGES} />
        </View>
        <View style={styles.drawerArea}>
          <HistoryDrawer entries={SAMPLE_HISTORY} activeId="1" />
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    width: "100%",
    padding: StyleVariable.spaceLg,
    gap: StyleVariable.spaceMd,
  },
  body: {
    flex: 1,
    flexDirection: "row",
    gap: StyleVariable.spaceLg,
  },
  chatArea: {
    flex: 1,
    backgroundColor: Color.colorWhite,
    borderRadius: StyleVariable.radiusLg,
    overflow: "hidden",
  },
  drawerArea: {
    width: 320,
  },
});

export default React.memo(PageShellIcon);

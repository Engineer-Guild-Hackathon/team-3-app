import * as React from "react";
import { ImageBackground, StyleSheet, View } from "react-native";

import { StyleVariable, Color } from "../GlobalStyles";
import ChatMainArea from "./ChatMainArea";
import Header from "./Header";
import HistoryDrawer from "./HistoryDrawer";
import type { ChatHistoryEntry, ChatMessage } from "./types";

const SAMPLE_MESSAGES: ChatMessage[] = [
  {
    id: "preview-user-1",
    author: "user",
    text: "確率の基礎を教えてください",
    createdAt: new Date().toISOString(),
  },
  {
    id: "preview-assistant-1",
    author: "assistant",
    text: "もちろんです。順番に整理してみましょう。",
    createdAt: new Date().toISOString(),
    status: -1,
  },
];

const SAMPLE_HISTORY: ChatHistoryEntry[] = [
  {
    id: "preview-thread-1",
    title: "確率入門",
    snippet: SAMPLE_MESSAGES[1].text,
    timestamp: SAMPLE_MESSAGES[1].createdAt,
    unread: false,
    lastAssistantStatus: -1,
  },
];

const PageShellIcon = () => {
  const messages = React.useMemo(() => SAMPLE_MESSAGES, []);
  const historyEntries = React.useMemo(() => SAMPLE_HISTORY, []);

  return (
    <ImageBackground
      style={styles.shell}
      resizeMode="cover"
      source={require("../assets/PageShellBg.png")}
    >
      <Header />
      <View style={styles.body}>
        <View style={styles.chatArea}>
          <ChatMainArea messages={messages} />
        </View>
        <View style={styles.drawerArea}>
          <HistoryDrawer entries={historyEntries} activeId={historyEntries[0]?.id} />
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

import * as React from "react";
import { ImageBackground, StyleSheet, View } from "react-native";

import { StyleVariable, Color } from "../GlobalStyles";
import ChatMainArea from "./ChatMainArea";
import Header from "./Header";
import HistoryDrawer from "./HistoryDrawer";
import { getSampleChatMessages, getSampleHistoryEntries } from "../utils/sampleData";

const PageShellIcon = () => {
  const messages = React.useMemo(() => getSampleChatMessages(), []);
  const historyEntries = React.useMemo(() => getSampleHistoryEntries(), []);

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

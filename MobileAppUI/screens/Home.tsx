import * as React from "react";
import { ScrollView, StyleSheet, View, ImageBackground } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "../components/Header";
import HistoryDrawer from "../components/HistoryDrawer";
import HomeMainArea from "../components/HomeMainArea";
import { Color, StyleVariable } from "../GlobalStyles";
import type { ChatHistoryEntry } from "../components/types";

const SAMPLE_HISTORY: ChatHistoryEntry[] = [
  { id: "1", title: "最近の質問", snippet: "チャットの流れを教えて", timestamp: "12:30", unread: true },
  { id: "2", title: "AI 相談", snippet: "分析レポートをまとめて", timestamp: "12:08" },
  { id: "3", title: "設計レビュー", snippet: "画面遷移について", timestamp: "昨日" },
  { id: "4", title: "議事録生成", snippet: "結論を要約", timestamp: "2日前" },
];

const Home = () => {
  return (
    <SafeAreaView style={styles.screen} edges={["bottom", "left", "right"]}>
      <Header />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.homeScrollViewContent}
      >
        <ImageBackground
          style={[styles.layoutpageshellIcon, styles.mainareaFlexBox]}
          resizeMode="cover"
        >
          <View style={[styles.mainarea, styles.mainareaFlexBox]}>
            <View style={[styles.contentarea, styles.mainareaFlexBox]}>
              <HomeMainArea historyEntries={SAMPLE_HISTORY} activeHistoryId="1" />
            </View>
            <View style={styles.drawerlayer}>
              <HistoryDrawer entries={SAMPLE_HISTORY} activeId="1" />
            </View>
          </View>
        </ImageBackground>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Color.colorWhite,
  },
  scroll: {
    flex: 1,
    width: "100%",
  },
  homeScrollViewContent: {
    flexGrow: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  mainareaFlexBox: {
    alignSelf: "stretch",
    flex: 1,
  },
  layoutpageshellIcon: {
    alignItems: "center",
    padding: StyleVariable.spaceLg,
    gap: StyleVariable.spaceMd,
  },
  mainarea: {
    overflow: "hidden",
  },
  contentarea: {
    flexDirection: "row",
    justifyContent: "center",
    zIndex: 0,
    overflow: "hidden",
  },
  drawerlayer: {
    width: 320,
    position: "absolute",
    top: 0,
    bottom: 0,
    left: -320,
    backgroundColor: Color.colorSurfaceGlass,
    zIndex: 1,
    overflow: "hidden",
  },
});

export default Home;

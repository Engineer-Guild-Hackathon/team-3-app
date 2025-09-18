import * as React from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import PageShell from "../components/PageShell";
import { homeHeaderConfig } from "../components/headerConfigs";
import HistoryDrawer from "../components/HistoryDrawer";
import HomeMainArea from "../components/HomeMainArea";
import { StyleVariable } from "../GlobalStyles";
import type { ChatHistoryEntry } from "../components/types";
import { SAMPLE_THREADS } from "../data/sampleThreads";
import type { RootStackParamList } from "../navigation/types";
import { buildHistoryEntry } from "../utils/chatHistory";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";

const SAMPLE_HISTORY: ChatHistoryEntry[] = SAMPLE_THREADS.map((thread) =>
  buildHistoryEntry(thread),
);

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, "Home">;

const Home = ({ navigation }: HomeScreenProps) => {
  const [activeHistoryId, setActiveHistoryId] = React.useState<string>(
    SAMPLE_HISTORY[0]?.id ?? "",
  );

  const handleSelectHistory = React.useCallback(
    (entry: ChatHistoryEntry) => {
      setActiveHistoryId(entry.id);
      navigation.navigate("Chat", { threadId: entry.id });
    },
    [navigation],
  );

  const handleCreateNewChat = React.useCallback(() => {
    navigation.navigate("Chat", { createNew: true });
  }, [navigation]);

  return (
    <PageShell
      headerConfig={homeHeaderConfig}
      rightActionVariant="settings"
      contentStyle={styles.shellContent}
      drawer={
        <HistoryDrawer
          entries={SAMPLE_HISTORY}
          activeId={activeHistoryId}
          onSelect={handleSelectHistory}
        />
      }
      drawerWidth={320}
      onCreateNewChat={handleCreateNewChat}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.homeScrollViewContent}
      >
        <View style={[styles.mainarea, styles.mainareaFlexBox]}>
          <View style={[styles.contentarea, styles.mainareaFlexBox]}>
            <HomeMainArea
              historyEntries={SAMPLE_HISTORY}
              activeHistoryId={activeHistoryId}
              onSelectHistory={handleSelectHistory}
            />
          </View>
        </View>
      </ScrollView>
    </PageShell>
  );
};

const styles = StyleSheet.create({
  shellContent: {
    alignItems: "center",
    gap: StyleVariable.spaceMd,
  },
  scroll: {
    flex: 1,
    width: "100%",
  },
  homeScrollViewContent: {
    flexGrow: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  mainareaFlexBox: {
    alignSelf: "stretch",
    flex: 1,
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
});

export default Home;

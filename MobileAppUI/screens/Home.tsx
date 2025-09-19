import * as React from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import PageShell from "../components/PageShell";
import { homeHeaderConfig } from "../components/headerConfigs";
import HistoryDrawer from "../components/HistoryDrawer";
import HomeMainArea from "../components/HomeMainArea";
import { StyleVariable } from "../GlobalStyles";
import type { ChatHistoryEntry } from "../components/types";
import type { RootStackParamList } from "../navigation/types";
import { buildHistoryEntry } from "../utils/chatHistory";
import { useChatStore } from "../contexts/chatStore";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, "Home">;

const Home = ({ navigation }: HomeScreenProps) => {
  const { threads } = useChatStore();

  const historyEntries = React.useMemo<ChatHistoryEntry[]>(
    () => threads.map((thread) => buildHistoryEntry(thread)),
    [threads],
  );

  const [activeHistoryId, setActiveHistoryId] = React.useState<string>(
    () => historyEntries[0]?.id ?? "",
  );

  React.useEffect(() => {
    if (historyEntries.length === 0) {
      setActiveHistoryId("");
      return;
    }
    const exists = historyEntries.some((entry) => entry.id === activeHistoryId);
    if (!exists) {
      setActiveHistoryId(historyEntries[0]?.id ?? "");
    }
  }, [historyEntries, activeHistoryId]);

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
          entries={historyEntries}
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
              historyEntries={historyEntries}
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

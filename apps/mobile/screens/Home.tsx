import * as React from "react";
import { ScrollView, StyleSheet, View, Text } from "react-native";

import PageShell from "../components/PageShell";
import { homeHeaderConfig } from "../components/headerConfigs";
import HistoryDrawer from "../components/HistoryDrawer";
import HomeMainArea from "../components/HomeMainArea";
import { StyleVariable } from "../GlobalStyles";
import type { ChatHistoryEntry } from "../components/types";
import type { RootStackParamList } from "../navigation/types";
import { useChatStore } from "../contexts/chatStore";
import { useAuth } from "../contexts/auth";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, "Home">;

const Home = ({ navigation }: HomeScreenProps) => {
  const { threads, histories, createThread } = useChatStore();
  const { profile, statusMessage, isAuthenticated, login, logout } = useAuth();

  const [activeHistoryId, setActiveHistoryId] = React.useState<string>("");

  React.useEffect(() => {
    if (histories.length === 0) {
      setActiveHistoryId("");
      return;
    }
    if (!activeHistoryId) {
      setActiveHistoryId(histories[0]?.id ?? "");
      return;
    }
    const exists = histories.some((entry) => entry.id === activeHistoryId);
    if (!exists) {
      setActiveHistoryId(histories[0]?.id ?? "");
    }
  }, [histories, activeHistoryId]);

  const handleSelectHistory = React.useCallback(
    (entry: ChatHistoryEntry) => {
      setActiveHistoryId(entry.id);
      navigation.navigate("Chat", { threadId: entry.id });
    },
    [navigation],
  );

  const handleCreateNewChat = React.useCallback(async () => {
    if (!isAuthenticated) {
      await login();
      return;
    }
    const created = await createThread();
    if (created) {
      setActiveHistoryId(created.id);
      navigation.navigate("Chat", { threadId: created.id });
    }
  }, [createThread, isAuthenticated, login, navigation]);

  const handleLogout = React.useCallback(() => {
    logout();
  }, [logout]);

  const userName = React.useMemo(() => {
    if (profile?.displayName && profile.displayName.trim().length > 0) {
      return profile.displayName;
    }
    if (profile?.email && profile.email.trim().length > 0) {
      return profile.email;
    }
    return "ゲスト";
  }, [profile]);

  return (
    <PageShell
      headerConfig={homeHeaderConfig}
      rightActionVariant="settings"
      contentStyle={styles.shellContent}
      drawer={
        <HistoryDrawer
          entries={histories}
          activeId={activeHistoryId}
          onSelect={handleSelectHistory}
          onCreatePress={handleCreateNewChat}
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
            <View style={styles.homeContentStack}>
              <HomeMainArea
                userName={userName}
                historyEntries={histories}
                activeHistoryId={activeHistoryId}
                onSelectHistory={handleSelectHistory}
                onLogout={handleLogout}
              />
              {statusMessage ? (
                <Text style={styles.statusText}>{statusMessage}</Text>
              ) : null}
            </View>
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
  homeContentStack: {
    flex: 1,
    gap: StyleVariable.spaceMd,
  },
  statusText: {
    fontSize: 14,
    color: "#475569",
  },
});

export default Home;

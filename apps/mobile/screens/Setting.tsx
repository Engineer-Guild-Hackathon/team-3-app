import * as React from "react";
import { StyleSheet, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import PageShell from "../components/PageShell";
import SelectionCard from "../components/SelectionCard";
import { chatHeaderConfig } from "../components/headerConfigs";
import HistoryDrawer from "../components/HistoryDrawer";
import type { ChatHistoryEntry } from "../components/types";
import type { RootStackParamList } from "../navigation/types";
import type { CheckboxCardItem } from "../components/CheckboxCard";
import { useSubjectStore } from "../contexts/subjectStore";
import { useChatStore } from "../contexts/chatStore";
import { useAuth } from "../contexts/auth";

type SettingScreenProps = NativeStackScreenProps<RootStackParamList, "Settings">;

const Setting = ({ navigation }: SettingScreenProps) => {
  const {
    subjects,
    selectedSubjectId,
    currentTopics,
    currentTopicIds,
    selectSubject,
    setTopicSelection,
    saveSubjectSelection,
    hasUnsavedChanges,
  } = useSubjectStore();
  const { histories, createThread } = useChatStore();
  const { isAuthenticated, login } = useAuth();

  const [activeHistoryId, setActiveHistoryId] = React.useState<string>(
    () => histories[0]?.id ?? "",
  );

  React.useEffect(() => {
    if (histories.length === 0) {
      if (activeHistoryId !== "") {
        setActiveHistoryId("");
      }
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
  }, [activeHistoryId, histories]);

  const handleNavigateHome = React.useCallback(() => {
    navigation.navigate("Home");
  }, [navigation]);

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

  const subjectOptions = React.useMemo(() => {
    return subjects.map((subject) => ({ value: subject.id, label: subject.label }));
  }, [subjects]);

  const checkboxItems = React.useMemo<CheckboxCardItem[]>(() => {
    if (!selectedSubjectId) {
      return [];
    }
    return currentTopics.map((topic) => ({
      id: topic.id,
      text: topic.label,
      checked: currentTopicIds.includes(topic.id),
      onChange: (nextChecked: boolean) => {
        setTopicSelection(selectedSubjectId, topic.id, nextChecked);
      },
    }));
  }, [currentTopicIds, currentTopics, selectedSubjectId, setTopicSelection]);

  const handleSubjectSelect = React.useCallback(
    (value: string) => {
      selectSubject(value);
    },
    [selectSubject],
  );

  const handleSave = React.useCallback(() => {
    const snapshot = saveSubjectSelection();
    if (snapshot) {
      console.log(
        `Saved subject ${snapshot.subjectId} with topics: ${
          snapshot.topicIds.length > 0 ? snapshot.topicIds.join(",") : "none"
        }`,
      );
    }
  }, [saveSubjectSelection]);

  return (
    <PageShell
      headerConfig={chatHeaderConfig}
      contentStyle={styles.shellContent}
      rightActionVariant="home"
      onNavigateHome={handleNavigateHome}
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
      <View style={styles.body}>
        <SelectionCard
          subjectsCardProps={{
            title: "教科",
            dropdownProps: {
              options: subjectOptions,
              value: selectedSubjectId,
              onSelect: handleSubjectSelect,
            },
          }}
          checkboxCardProps={{
            title: "分野",
            heightMode: "flex",
            items: checkboxItems,
          }}
          storeButtnoProps={{
            onPress: handleSave,
            disabled: checkboxItems.length === 0 || !hasUnsavedChanges,
          }}
          heightMode="flex"
          style={styles.selectionCard}
        />
      </View>
    </PageShell>
  );
};

const styles = StyleSheet.create({
  shellContent: {
    flex: 1,
    padding: 16,
  },
  body: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    width: "100%",
  },
  selectionCard: {
    alignSelf: "stretch",
  },
});

export default Setting;

import * as React from "react";
import { StyleSheet, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import PageShell from "../components/PageShell";
import SelectionCard from "../components/SelectionCard";
import { chatHeaderConfig } from "../components/headerConfigs";
import type { RootStackParamList } from "../navigation/types";
import type { CheckboxCardItem } from "../components/CheckboxCard";
import { useSubjectStore } from "../contexts/subjectStore";

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

  const handleNavigateHome = React.useCallback(() => {
    navigation.navigate("Home");
  }, [navigation]);

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

  const headerConfig = React.useMemo(() => {
    return {
      ...chatHeaderConfig,
      menu: null,
    };
  }, []);

  return (
    <PageShell
      headerConfig={headerConfig}
      contentStyle={styles.shellContent}
      rightActionVariant="home"
      onNavigateHome={handleNavigateHome}
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

import * as React from "react";
import { Image, ImageBackground, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import SelectionCard from "../components/SelectionCard";
import { useSubjectStore } from "../contexts/subjectStore";
import type { CheckboxCardItem } from "../components/CheckboxCard";
import type { RootStackParamList } from "../navigation/types";
import { Color, FontFamily, FontSize } from "../GlobalStyles";

type FirstSettingScreenProps = NativeStackScreenProps<RootStackParamList, "FirstSetting">;

const FirstSetting = ({ navigation }: FirstSettingScreenProps) => {
  const {
    subjects,
    selectedSubjectId,
    currentTopics,
    currentTopicIds,
    selectSubject,
    setTopicSelection,
    saveSubjectSelection,
  } = useSubjectStore();

  React.useEffect(() => {
    if (!selectedSubjectId && subjects[0]?.id) {
      selectSubject(subjects[0].id);
    }
  }, [selectSubject, selectedSubjectId, subjects]);

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
      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
    }
  }, [navigation, saveSubjectSelection]);

  return (
    <ImageBackground
      source={require("../assets/PageShellBg.png")}
      resizeMode="cover"
      style={styles.background}
    >
      <View style={styles.overlay}>
        <View style={styles.header}>
          <Image
            source={require("../assets/SPARLogo.png")}
            style={styles.logo}
            accessibilityRole="image"
            accessibilityLabel="SPAR"
          />
          <Text style={styles.welcomeTitle}>こんにちは！</Text>
          <Text style={styles.welcomeDescription}>
            SPARをご利用いただきありがとうございます。最初に興味のある教科や分野を選んで、学習を始めましょう！
          </Text>
        </View>
        <View style={styles.cardWrapper}>
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
              disabled: !selectedSubjectId,
              label: "ホームへ進む",
            }}
            heightMode="flex"
            style={styles.selectionCard}
          />
          <Text style={styles.note}>後から設定画面でいつでも変更できます。</Text>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 48,
    justifyContent: "center",
    alignItems: "stretch",
    gap: 32,
  },
  header: {
    alignItems: "center",
    alignSelf: "center",
    width: "100%",
    maxWidth: 480,
    gap: 16,
  },
  logo: {
    width: 320,
    height: 120,
    resizeMode: "contain",
  },
  welcomeTitle: {
    fontSize: 36,
    fontFamily: FontFamily.roundedMplus1c,
    color: Color.colorTextPrimary,
  },
  welcomeDescription: {
    fontSize: FontSize.size_18,
    fontFamily: FontFamily.notoSansJPRegular,
    color: Color.colorTextSecondary,
    textAlign: "left",
    lineHeight: 26,
    maxWidth: 360,
    alignSelf: "stretch",
  },
  cardWrapper: {
    flex: 1,
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
    alignItems: "stretch",
  },
  selectionCard: {
    flex: 1,
    alignSelf: "stretch",
    minHeight: 0,
  },
  note: {
    marginTop: 16,
    fontSize: 14,
    color: Color.colorTextSecondary,
    textAlign: "left",
    alignSelf: "stretch",
  },
});

export default FirstSetting;

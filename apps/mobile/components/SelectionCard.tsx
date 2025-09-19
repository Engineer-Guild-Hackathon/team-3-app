import * as React from "react";
import { StyleSheet, View } from "react-native";

import Card, { CardProps } from "./Card";
import CheckboxCard, { CheckboxCardProps } from "./CheckboxCard";
import SubjectsCard, { SubjectsCardProps } from "./SubjectsCard";
import StoreButtno, { StoreButtnoProps } from "./StoreButtno";
import { StyleVariable } from "../GlobalStyles";

export type SelectionCardProps = Omit<CardProps, "title" | "children"> & {
  subjectsCardProps: SubjectsCardProps;
  checkboxCardProps: CheckboxCardProps;
  storeButtnoProps?: StoreButtnoProps;
};

const SelectionCard: React.FC<SelectionCardProps> = ({
  subjectsCardProps,
  checkboxCardProps,
  storeButtnoProps,
  heightMode,
  height,
  style,
}) => {
  const { style: subjectsStyle, ...restSubjects } = subjectsCardProps;
  const { style: checkboxStyle, ...restCheckbox } = checkboxCardProps;
  const { containerStyle: storeContainerStyle, ...restStore } = storeButtnoProps ?? {};

  return (
    <Card
      title="教科・分野選択"
      heightMode={heightMode}
      height={height}
      style={style}
    >
      <View style={styles.content}>
        <SubjectsCard
          {...restSubjects}
          style={[styles.subjectCard, subjectsStyle]}
        />
        <CheckboxCard
          {...restCheckbox}
          style={[styles.topicCard, checkboxStyle]}
        />
        <StoreButtno
          {...restStore}
          containerStyle={[styles.storeButton, storeContainerStyle]}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignSelf: "stretch",
    minHeight: 0,
    gap: StyleVariable.spaceLg,
  },
  subjectCard: {
    alignSelf: "stretch",
  },
  topicCard: {
    flex: 1,
    alignSelf: "stretch",
    minHeight: 0,
  },
  storeButton: {
    alignSelf: "center",
  },
});

export default React.memo(SelectionCard);

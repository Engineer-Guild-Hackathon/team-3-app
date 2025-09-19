import * as React from "react";
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from "react-native";

import Card, { CardProps } from "./Card";
import CheckboxTextRow, { CheckboxTextRowProps } from "./CheckboxTextRow";
import { StyleVariable } from "../GlobalStyles";

export type CheckboxCardItem = {
  id: string;
} & CheckboxTextRowProps;

export type CheckboxCardProps = Omit<CardProps, "children"> & {
  items: CheckboxCardItem[];
  scrollViewStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

const CheckboxCard: React.FC<CheckboxCardProps> = ({
  title,
  items,
  heightMode,
  height,
  style,
  scrollViewStyle,
  contentContainerStyle,
}) => {
  return (
    <Card title={title} heightMode={heightMode} height={height} style={style}>
      <ScrollView
        style={[styles.scrollView, scrollViewStyle]}
        contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {items.map(({ id, ...itemProps }) => (
          <CheckboxTextRow key={id} {...itemProps} />
        ))}
      </ScrollView>
    </Card>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    alignSelf: "stretch",
    minHeight: 0,
  },
  contentContainer: {
    gap: StyleVariable.spaceSm,
    paddingVertical: StyleVariable.spaceSm,
  },
});

export default React.memo(CheckboxCard);

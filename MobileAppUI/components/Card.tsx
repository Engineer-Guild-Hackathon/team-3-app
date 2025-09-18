import * as React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Color, StyleVariable, FontSize, FontFamily } from "../GlobalStyles";

export type CardProps = {
  title?: string;
  children?: React.ReactNode;
};

const Card = ({ title, children }: CardProps) => {
  return (
    <View style={styles.container}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Color.colorGray100,
    padding: StyleVariable.spaceSm,
    gap: StyleVariable.spaceSm,
    borderRadius: StyleVariable.radiusMd,
  },
  title: {
    fontSize: FontSize.size_24,
    lineHeight: 30,
    fontWeight: "800",
    fontFamily: FontFamily.roundedMplus1c,
    color: Color.colorBlack,
    textAlign: "left",
  },
  body: {
    gap: StyleVariable.spaceSm,
  },
});

export default React.memo(Card);

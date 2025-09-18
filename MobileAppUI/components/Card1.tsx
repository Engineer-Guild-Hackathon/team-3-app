import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Card from "./Card";
import { StyleVariable } from "../GlobalStyles";

export type Card1Type = {
  /** Variant props */
  drawerOpen?: boolean;

  /** Style props */
  cardBorderRadius?: number;
};

const getStyleValue = (key: string, value: string | number | undefined) => {
  if (value === undefined) return;
  return { [key]: value === "unset" ? undefined : value };
};
const Card1 = ({ drawerOpen = false, cardBorderRadius }: Card1Type) => {
  const cardStyle = useMemo(() => {
    return {
      ...getStyleValue("borderRadius", cardBorderRadius),
    };
  }, [cardBorderRadius]);

  return (
    <View style={[styles.historycard, cardStyle]}>
      <Card bgStyle="glass" hasTitle />
    </View>
  );
};

const styles = StyleSheet.create({
  historycard: {
    alignSelf: "stretch",
    flex: 1,
    borderRadius: StyleVariable.radiusLg,
    overflow: "hidden",
  },
});

export default Card1;

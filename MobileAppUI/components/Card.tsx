import * as React from "react";
import { Text, StyleSheet, View } from "react-native";
import List1 from "./List1";
import { Color, StyleVariable, FontSize, FontFamily } from "../GlobalStyles";

export type CardType = {
  /** Variant props */
  bgStyle?: string;
  hasTitle?: boolean;
};

const Card = ({ bgStyle = "transparent", hasTitle = true }: CardType) => {
  return (
    <View style={[styles.card, styles.cardFlexBox]}>
      <Text style={styles.text}>履歴</Text>
      <View style={styles.cardFlexBox}>
        <List1 bgStyle="glass" hasTitle />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardFlexBox: {
    alignItems: "center",
    overflow: "hidden",
    flex: 1,
    alignSelf: "stretch",
  },
  card: {
    backgroundColor: Color.colorGray100,
    padding: StyleVariable.spaceSm,
    gap: StyleVariable.spaceSm,
  },
  text: {
    fontSize: FontSize.size_24,
    lineHeight: 30,
    fontWeight: "800",
    fontFamily: FontFamily.roundedMplus1c,
    color: Color.colorBlack,
    textAlign: "center",
    alignSelf: "stretch",
  },
});

export default Card;

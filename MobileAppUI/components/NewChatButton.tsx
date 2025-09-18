import * as React from "react";
import { Text, StyleSheet, View } from "react-native";
import IconButton from "./IconButton";
import { StyleVariable, Color, FontSize, FontFamily } from "../GlobalStyles";

export type NewChatButtonType = {
  /** Variant props */
  drawerOpen?: boolean;
};

const NewChatButton = ({ drawerOpen = false }: NewChatButtonType) => {
  return (
    <View style={styles.newchatbutton}>
      <IconButton />
      <Text style={styles.text}>新しい質問</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  newchatbutton: {
    alignSelf: "stretch",
    borderRadius: StyleVariable.radiusMd,
    backgroundColor: Color.colorCornflowerblue200,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: StyleVariable.spaceMd,
    gap: StyleVariable.spaceMd,
  },
  text: {
    fontSize: FontSize.size_24,
    lineHeight: 30,
    fontWeight: "800",
    fontFamily: FontFamily.roundedMplus1c,
    color: Color.colorWhite,
    textAlign: "left",
  },
});

export default NewChatButton;

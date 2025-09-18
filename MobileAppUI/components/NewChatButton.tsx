import * as React from "react";
import { Text, StyleSheet, View } from "react-native";
import IconButton from "./IconButton";
import { StyleVariable, Color, FontSize, FontFamily } from "../GlobalStyles";
import CreateIcon from "../assets/Create.svg";

export type NewChatButtonProps = {
  label?: string;
  onPress?: () => void;
};

const NewChatButton = ({ label = "新しい質問", onPress }: NewChatButtonProps) => {
  return (
    <View style={styles.container}>
      <IconButton Icon={CreateIcon} onPress={onPress} accessibilityLabel={label} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    borderRadius: StyleVariable.radiusMd,
    backgroundColor: Color.colorBrandSecondary,
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

export default React.memo(NewChatButton);

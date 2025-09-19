import * as React from "react";
import { Pressable, Text, StyleSheet, View } from "react-native";

import IconButton from "./IconButton";
import { StyleVariable, Color, FontSize, FontFamily } from "../GlobalStyles";
import CreateIcon from "../assets/Create.svg";

export type NewChatButtonProps = {
  label?: string;
  onPress?: () => void;
};

const NewChatButton = ({ label = "新しい質問", onPress }: NewChatButtonProps) => {
  return (
    <Pressable style={styles.container} onPress={onPress} accessibilityRole="button">
      <View style={styles.iconWrapper}>
        <IconButton
          Icon={CreateIcon}
          accessibilityLabel={label}
          onPress={onPress}
          containerStyle={styles.iconButton}
        />
      </View>
      <Text style={styles.text}>{label}</Text>
    </Pressable>
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
  iconWrapper: {
    borderRadius: StyleVariable.radiusMd,
    overflow: "hidden",
  },
  iconButton: {
    paddingVertical: StyleVariable.spaceXs,
    paddingHorizontal: StyleVariable.spaceSm,
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

import * as React from "react";
import { Pressable, StyleSheet } from "react-native";

import Vector from "../assets/Vector.svg";
import { StyleVariable, Color } from "../GlobalStyles";

export type SendButtonProps = {
  onPress?: () => void;
  accessibilityLabel?: string;
};

const SendButton = ({ onPress, accessibilityLabel = "送信" }: SendButtonProps) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Vector width="75%" height="75%" />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: StyleVariable.iconSizeXl,
    height: StyleVariable.iconSizeXl,
    borderRadius: StyleVariable.radiusMd,
    backgroundColor: Color.colorBrandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.8,
  },
});

export default React.memo(SendButton);

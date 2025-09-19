import * as React from "react";
import { Pressable, StyleSheet } from "react-native";

import Vector from "../assets/Vector.svg";
import { StyleVariable, Color } from "../GlobalStyles";

export type SendButtonProps = {
  onPress?: () => void;
  accessibilityLabel?: string;
  disabled?: boolean;
};

const SendButton = ({
  onPress,
  accessibilityLabel = "送信",
  disabled = false,
}: SendButtonProps) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        disabled ? styles.disabled : null,
        pressed && !disabled ? styles.pressed : null,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
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
  disabled: {
    backgroundColor: Color.colorRoleAssistant,
  },
});

export default React.memo(SendButton);

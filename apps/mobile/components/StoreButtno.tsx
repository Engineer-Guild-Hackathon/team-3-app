import * as React from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from "react-native";

import { Color, FontFamily, FontSize, StyleVariable } from "../GlobalStyles";

export type StoreButtnoProps = {
  label?: string;
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  containerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  testID?: string;
};

const StoreButtno = React.forwardRef<Pressable, StoreButtnoProps>(
  (
    {
      label = "保存",
      onPress,
      disabled = false,
      accessibilityLabel,
      containerStyle,
      labelStyle,
      testID,
    },
    ref,
  ) => {
    const resolvedAccessibilityLabel = accessibilityLabel ?? label;

    return (
      <Pressable
        ref={ref}
        testID={testID}
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={resolvedAccessibilityLabel}
        accessibilityState={{ disabled }}
        style={({ pressed }) => [
          styles.button,
          containerStyle,
          disabled ? styles.buttonDisabled : null,
          pressed && !disabled ? styles.buttonPressed : null,
        ]}
      >
        <Text
          style={[
            styles.label,
            labelStyle,
            disabled ? styles.labelDisabled : null,
          ]}
        >
          {label}
        </Text>
      </Pressable>
    );
  },
);

StoreButtno.displayName = "StoreButtno";

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: StyleVariable.radiusMd,
    backgroundColor: Color.colorBrandPrimary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: StyleVariable.spaceLg,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    backgroundColor: Color.colorRoleAssistant,
  },
  label: {
    fontFamily: FontFamily.notoSansJPRegular,
    fontSize: FontSize.size_18,
    color: Color.colorWhite,
  },
  labelDisabled: {
    color: Color.colorDimgray,
  },
});

export default React.memo(StoreButtno);

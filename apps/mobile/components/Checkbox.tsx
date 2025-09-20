import * as React from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import Svg, { Path } from "react-native-svg";

import { Border, Color, FontFamily, FontSize, Gap } from "../GlobalStyles";

export type CheckboxProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (value: boolean) => void;
  label?: string;
  description?: string;
  helperText?: string;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  checkboxStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  descriptionStyle?: StyleProp<TextStyle>;
  helperTextStyle?: StyleProp<TextStyle>;
  testID?: string;
};

const Checkbox = React.forwardRef<React.ElementRef<typeof Pressable>, CheckboxProps>(
  (
    {
      checked,
      defaultChecked = false,
      onChange,
      label,
      description,
      helperText,
      disabled = false,
      containerStyle,
      contentStyle,
      checkboxStyle,
      labelStyle,
      descriptionStyle,
      helperTextStyle,
      testID,
    },
    ref,
  ) => {
    const isControlled = typeof checked === "boolean";
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked);

    const currentChecked = isControlled ? checked! : internalChecked;

    const handleToggle = React.useCallback(() => {
      if (disabled) {
        return;
      }
      const next = !currentChecked;
      if (!isControlled) {
        setInternalChecked(next);
      }
      onChange?.(next);
    }, [currentChecked, disabled, isControlled, onChange]);

    React.useEffect(() => {
      if (isControlled) {
        setInternalChecked(checked ?? false);
      }
    }, [checked, isControlled]);

    return (
      <View style={[styles.root, containerStyle]}>
        <Pressable
          ref={ref}
          testID={testID}
          accessibilityRole="checkbox"
          accessibilityState={{ disabled, checked: currentChecked }}
          onPress={handleToggle}
          disabled={disabled}
          style={({ pressed }) => [
            styles.container,
            contentStyle,
            pressed && !disabled ? styles.containerPressed : null,
            disabled ? styles.containerDisabled : null,
          ]}
        >
          <View
            style={[
              styles.checkbox,
              currentChecked ? styles.checkboxChecked : null,
              disabled ? styles.checkboxDisabled : null,
              checkboxStyle,
            ]}
          >
            {currentChecked ? (
              <Svg width={16} height={12} viewBox="0 0 16 12">
                <Path
                  d="M1 6.5L5.5 11 15 1.5"
                  stroke={Color.colorWhite}
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </Svg>
            ) : null}
          </View>
          <View style={styles.textContainer}>
            {label ? (
              <Text
                style={[
                  styles.label,
                  disabled ? styles.labelDisabled : null,
                  labelStyle,
                ]}
              >
                {label}
              </Text>
            ) : null}
            {description ? (
              <Text
                style={[
                  styles.description,
                  disabled ? styles.descriptionDisabled : null,
                  descriptionStyle,
                ]}
              >
                {description}
              </Text>
            ) : null}
          </View>
        </Pressable>
        {helperText ? (
          <Text
            style={[
              styles.helperText,
              disabled ? styles.helperTextDisabled : null,
              helperTextStyle,
            ]}
          >
            {helperText}
          </Text>
        ) : null}
      </View>
    );
  },
);

Checkbox.displayName = "Checkbox";

const styles = StyleSheet.create({
  root: {
    width: "100%",
    gap: Gap.gap_4,
  },
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Gap.gap_8,
  },
  containerPressed: {
    opacity: 0.8,
  },
  containerDisabled: {
    opacity: 0.6,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: Border.br_4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Color.colorGray200,
    backgroundColor: Color.colorWhite,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: Color.colorBrandPrimary,
    borderColor: Color.colorBrandPrimary,
  },
  checkboxDisabled: {
    backgroundColor: Color.colorGray100,
  },
  textContainer: {
    flex: 1,
    gap: Gap.gap_4,
  },
  label: {
    fontFamily: FontFamily.notoSansJPRegular,
    fontSize: FontSize.size_18,
    color: Color.colorTextPrimary,
  },
  labelDisabled: {
    color: Color.colorDimgray,
  },
  description: {
    fontFamily: FontFamily.notoSansJPRegular,
    fontSize: FontSize.size_14,
    color: Color.colorTextSecondary,
  },
  descriptionDisabled: {
    color: Color.colorDimgray,
  },
  helperText: {
    fontFamily: FontFamily.notoSansJPRegular,
    fontSize: FontSize.size_14,
    color: Color.colorTextSecondary,
    marginLeft: 32,
  },
  helperTextDisabled: {
    color: Color.colorDimgray,
  },
});

export default React.memo(Checkbox);

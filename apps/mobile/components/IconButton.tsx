import * as React from "react";
import {
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from "react-native";
import type { SvgProps } from "react-native-svg";

import { StyleVariable, FontSize, FontFamily, Color } from "../GlobalStyles";
import HamburgerMenu from "../assets/Hamburger-Menu.svg";

type IconComponent = React.ComponentType<SvgProps>;

export type IconButtonProps = {
  label?: string;
  Icon?: IconComponent;
  containerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  actionId?: string;
} & Omit<PressableProps, "style">;

const IconButton = React.forwardRef<React.ElementRef<typeof Pressable>, IconButtonProps>(
  (
    {
      actionId: _actionId,
      label,
      Icon = HamburgerMenu,
      containerStyle,
      labelStyle,
      accessibilityRole = "button",
      accessibilityLabel,
      ...pressableProps
    },
    ref,
  ) => {
    const resolvedAccessibilityLabel = accessibilityLabel ?? label ?? "icon";

    return (
      <Pressable
        ref={ref}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={resolvedAccessibilityLabel}
        style={({ pressed }) => [styles.root, pressed && styles.pressed, containerStyle]}
        {...pressableProps}
      >
        <Icon
          width={StyleVariable.iconSizeLg}
          height={StyleVariable.iconSizeLg}
          style={styles.icon}
        />
        {label ? <Text style={[styles.text, labelStyle]}>{label}</Text> : null}
      </Pressable>
    );
  },
);

IconButton.displayName = "IconButton";

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: StyleVariable.spaceXs,
    paddingHorizontal: StyleVariable.spaceSm,
    gap: StyleVariable.space4,
  },
  pressed: {
    opacity: 0.6,
  },
  icon: {
    alignSelf: "center",
  },
  text: {
    fontSize: FontSize.size_14,
    lineHeight: 22,
    fontFamily: FontFamily.notoSansJPRegular,
    color: Color.colorBrandPrimary,
    textAlign: "center",
  },
});

export default React.memo(IconButton);

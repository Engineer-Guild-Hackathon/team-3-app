import * as React from "react";
import { StyleSheet, Text, View, ViewStyle, StyleProp } from "react-native";

import {
  Color,
  StyleVariable,
  FontSize,
  FontFamily,
  GlassStyle,
} from "../GlobalStyles";

export type CardProps = {
  title?: string;
  children?: React.ReactNode;
  heightMode?: "auto" | "fixed" | "flex";
  height?: number;
  style?: StyleProp<ViewStyle>;
};

const Card = ({
  title,
  children,
  heightMode = "auto",
  height,
  style,
}: CardProps) => {
  const dynamicStyle = React.useMemo(() => {
    switch (heightMode) {
      case "fixed":
        return height != null ? { height } : undefined;
      case "flex":
        return styles.flex;
      default:
        return undefined;
    }
  }, [heightMode, height]);

  return (
    <View style={[GlassStyle.surface, styles.container, dynamicStyle, style]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children ? <View style={styles.body}>{children}</View> : children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: StyleVariable.spaceSm,
    gap: StyleVariable.spaceSm,
    borderRadius: StyleVariable.radiusMd,
  },
  flex: {
    flex: 1,
    alignSelf: "stretch",
  },
  title: {
    fontSize: FontSize.size_24,
    lineHeight: 30,
    fontWeight: "800",
    fontFamily: FontFamily.roundedMplus1c,
    color: Color.colorBlack,
    textAlign: "center",
  },
  body: {
    gap: StyleVariable.spaceSm,
  },
});

export default React.memo(Card);

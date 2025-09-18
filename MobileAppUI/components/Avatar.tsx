import * as React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import AvatarSvg from "../assets/Avatar.svg";
import { Color } from "../GlobalStyles";

export type AvatarProps = {
  size?: number;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
};

const Avatar = ({
  size = 48,
  backgroundColor = Color.highlightLightest,
  style,
}: AvatarProps) => {
  const dimensionStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor,
  };

  return (
    <View style={[styles.container, dimensionStyle, style]}>
      <AvatarSvg width={size * 0.6} height={size * 0.6} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});

export default React.memo(Avatar);

import * as React from "react";
import { StyleSheet, View } from "react-native";
import Vector from "../assets/Vector.svg";
import { StyleVariable, Color } from "../GlobalStyles";

export type Icon2Type = {
  /** Variant props */
  variant?: string;
};

const Icon2 = ({ variant = "chevron_down" }: Icon2Type) => {
  return (
    <View style={styles.icon}>
      <Vector style={styles.vectorIcon} />
    </View>
  );
};

const styles = StyleSheet.create({
  icon: {
    width: StyleVariable.iconSizeXl,
    borderRadius: StyleVariable.radiusMd,
    backgroundColor: Color.colorBrandPrimary,
    height: StyleVariable.iconSizeXl,
    overflow: "hidden",
  },
  vectorIcon: {
    position: "absolute",
    height: "75%",
    width: "75%",
    top: "12.5%",
    right: "12.5%",
    bottom: "12.5%",
    left: "12.5%",
    maxWidth: "100%",
    maxHeight: "100%",
    overflow: "hidden",
  },
});

export default Icon2;

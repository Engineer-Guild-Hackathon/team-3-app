import * as React from "react";
import { StyleSheet, View } from "react-native";
import Avatar1 from "./Avatar1";
import { StyleVariable } from "../GlobalStyles";

export type Icon1Type = {
  /** Variant props */
  selected?: boolean;
  size?: string;
};

const Icon1 = ({ selected = true, size = "default" }: Icon1Type) => {
  return (
    <View style={styles.icon}>
      <Avatar1 />
    </View>
  );
};

const styles = StyleSheet.create({
  icon: {
    width: StyleVariable.iconSizeLg,
    height: StyleVariable.iconSizeLg,
  },
});

export default Icon1;

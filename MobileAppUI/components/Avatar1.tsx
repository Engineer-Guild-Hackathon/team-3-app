import * as React from "react";
import { StyleSheet, View } from "react-native";
import Avatar from "./Avatar";
import { StyleVariable } from "../GlobalStyles";

const Avatar1 = () => {
  return (
    <View style={styles.root}>
      <Avatar size="S" />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    width: StyleVariable.iconSizeLg,
    height: StyleVariable.iconSizeLg,
  },
});

export default Avatar1;

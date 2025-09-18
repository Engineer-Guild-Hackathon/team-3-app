import * as React from "react";
import { TextInput, StyleSheet, View } from "react-native";
import Icon2 from "./Icon2";
import {
  StyleVariable,
  Color,
  Padding,
  Gap,
  Border,
  FontFamily,
  FontSize,
} from "../GlobalStyles";

export type InputAreaType = {
  /** Variant props */
  drawerOpen?: boolean;
};

const InputArea = ({ drawerOpen = false }: InputAreaType) => {
  return (
    <View style={styles.chatinputarea}>
      <TextInput
        style={styles.input}
        placeholder="Good Mor|"
        placeholderTextColor="#000"
      />
      <Icon2 variant="send-alt-filled" />
    </View>
  );
};

const styles = StyleSheet.create({
  chatinputarea: {
    width: 350,
    borderRadius: StyleVariable.radiusMd,
    backgroundColor: Color.colorSurfaceGlass,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    padding: Padding.p_10,
    gap: Gap.gap_10,
    justifyContent: "center",
  },
  input: {
    flex: 1,
    borderRadius: Border.br_4,
    padding: StyleVariable.spaceSm,
    width: "100%",
    fontFamily: FontFamily.notoSansJPRegular,
    fontSize: FontSize.size_18,
    justifyContent: "center",
  },
});

export default InputArea;

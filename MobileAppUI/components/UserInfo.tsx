import * as React from "react";
import { Text, StyleSheet, View } from "react-native";
import Avatar1 from "./Avatar1";
import {
  Border,
  Color,
  StyleVariable,
  FontSize,
  FontFamily,
} from "../GlobalStyles";

export type UserInfoType = {
  /** Variant props */
  drawerOpen?: boolean;
};

const UserInfo = ({ drawerOpen = false }: UserInfoType) => {
  return (
    <View style={styles.userinfo}>
      <Avatar1 />
      <Text style={styles.username}>UserName</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  userinfo: {
    borderRadius: Border.br_12,
    backgroundColor: Color.colorGray100,
    overflow: "hidden",
    flexDirection: "row",
    justifyContent: "center",
    padding: StyleVariable.spaceSm,
    gap: StyleVariable.spaceSm,
    alignItems: "center",
  },
  username: {
    height: 30,
    width: 123,
    fontSize: FontSize.size_24,
    lineHeight: 30,
    fontWeight: "800",
    fontFamily: FontFamily.roundedMplus1c,
    color: Color.colorBlack,
    textAlign: "left",
    display: "flex",
    alignItems: "center",
  },
});

export default UserInfo;

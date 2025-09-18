import * as React from "react";
import { Text, StyleSheet, View } from "react-native";

import Avatar from "./Avatar";
import {
  Border,
  Color,
  StyleVariable,
  FontSize,
  FontFamily,
  GlassStyle,
} from "../GlobalStyles";

export type UserInfoProps = {
  name?: string;
  avatarSize?: number;
};

const UserInfo = ({ name = "UserName", avatarSize = 48 }: UserInfoProps) => {
  return (
    <View style={[GlassStyle.surface, styles.container]}>
      <Avatar size={avatarSize} />
      <Text style={styles.username}>{name}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: Border.br_12,
    flexDirection: "row",
    alignItems: "center",
    padding: StyleVariable.spaceSm,
    gap: StyleVariable.spaceSm,
  },
  username: {
    fontSize: FontSize.size_24,
    lineHeight: 30,
    fontWeight: "800",
    fontFamily: FontFamily.roundedMplus1c,
    color: Color.colorBlack,
  },
});

export default React.memo(UserInfo);

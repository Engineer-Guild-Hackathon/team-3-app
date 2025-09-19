import * as React from "react";
import { Pressable, Text, StyleSheet, View } from "react-native";

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
  onLogout?: () => void;
};

const UserInfo = ({ name = "UserName", avatarSize = 48, onLogout }: UserInfoProps) => {
  return (
    <View style={[GlassStyle.surface, styles.container]}>
      <Avatar size={avatarSize} />
      <Text style={styles.username}>{name}</Text>
      {onLogout ? (
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.logoutButton, pressed ? styles.logoutButtonPressed : null]}
          onPress={onLogout}
        >
          <Text style={styles.logoutLabel}>ログアウト</Text>
        </Pressable>
      ) : null}
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
  logoutButton: {
    marginLeft: StyleVariable.spaceMd,
    paddingHorizontal: StyleVariable.spaceSm,
    paddingVertical: StyleVariable.spaceXs,
    borderRadius: StyleVariable.radiusMd,
    backgroundColor: Color.colorChatTapped,
  },
  logoutButtonPressed: {
    opacity: 0.8,
  },
  logoutLabel: {
    fontSize: FontSize.size_14,
    fontFamily: FontFamily.notoSansJPRegular,
    color: Color.colorTextPrimary,
    fontWeight: "600",
  },
});

export default React.memo(UserInfo);

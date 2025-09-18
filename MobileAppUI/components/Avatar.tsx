import * as React from "react";
import { StyleSheet, View } from "react-native";
import Avatar2 from "../assets/Avatar.svg";
import { Border, Color } from "../GlobalStyles";

export type AvatarType = {
  /** Variant props */
  size?: string;
};

const Avatar = ({ size = "S" }: AvatarType) => {
  return (
    <View style={[styles.avatar, styles.avatarPosition]}>
      <Avatar2 style={[styles.avatarIcon, styles.avatarPosition]} />
    </View>
  );
};

const styles = StyleSheet.create({
  avatarPosition: {
    overflow: "hidden",
    position: "absolute",
  },
  avatar: {
    height: "100%",
    width: "100%",
    top: "0%",
    right: "0%",
    bottom: "0%",
    left: "0%",
    borderRadius: Border.br_16,
    backgroundColor: Color.highlightLightest,
  },
  avatarIcon: {
    height: "105%",
    width: "60%",
    top: "20%",
    right: "20%",
    bottom: "-25%",
    left: "20%",
    maxWidth: "100%",
    maxHeight: "100%",
  },
});

export default Avatar;

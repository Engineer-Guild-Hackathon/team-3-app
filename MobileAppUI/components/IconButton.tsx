import * as React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import HamburgerMenu from "../assets/Hamburger-Menu.svg";
import { StyleVariable, FontSize, FontFamily, Color } from "../GlobalStyles";

const IconButton = () => {
  return (
    <Pressable style={styles.root}>
      <HamburgerMenu
        style={styles.hamburgerMenuIcon}
        width={NaN}
        height={NaN}
      />
      <Text style={styles.text}>履歴</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: "hidden",
    alignItems: "center",
  },
  hamburgerMenuIcon: {
    width: StyleVariable.iconSizeLg,
    height: StyleVariable.iconSizeLg,
  },
  text: {
    width: 31,
    height: 22,
    fontSize: FontSize.size_14,
    lineHeight: 22,
    fontFamily: FontFamily.notoSansJPRegular,
    color: Color.colorBrandPrimary,
    textAlign: "center",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default IconButton;

import * as React from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";

import CreateIcon from "../assets/Create.svg";
import CreateAltIcon from "../assets/Create2.svg";
import MenuIcon from "../assets/Hamburger-Menu.svg";
import IconButton, { IconButtonProps } from "./IconButton";
import { Gap, Color, StyleVariable, Padding } from "../GlobalStyles";

type HeaderButtonConfig = Pick<IconButtonProps, "label" | "Icon" | "onPress" | "accessibilityLabel">;

export type HeaderProps = {
  menuButton?: HeaderButtonConfig;
  actionButtons?: HeaderButtonConfig[];
};

const defaultMenuButton: HeaderButtonConfig = {
  label: "履歴",
  Icon: MenuIcon,
};

const defaultActionButtons: HeaderButtonConfig[] = [
  {
    Icon: CreateIcon,
    accessibilityLabel: "新しいチャット",
  },
  {
    Icon: CreateAltIcon,
    accessibilityLabel: "その他の操作",
  },
];

const Header = ({ menuButton = defaultMenuButton, actionButtons = defaultActionButtons }: HeaderProps) => {
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.leftGroup}>
          <IconButton {...menuButton} />
        </View>
        <View style={styles.centerGroup}>
          <Image
            style={styles.logo}
            contentFit="contain"
            source={require("../assets/SPARLogo.png")}
          />
        </View>
        <View style={styles.rightGroup}>
          {actionButtons.map((button, index) => (
            <IconButton key={index} {...button} />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    backgroundColor: Color.colorGray100,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Color.colorGray200,
    boxShadow: "0px 2px 16px rgba(0, 0, 0, 0.06)",
    shadowColor: Color.colorGray200,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 16,
    elevation: 16,
    shadowOpacity: 1,
  },
  topBar: {
    paddingHorizontal: StyleVariable.spaceLg,
    paddingVertical: StyleVariable.spaceSm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Gap.gap_10,
  },
  leftGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  centerGroup: {
    flex: 1,
    paddingHorizontal: Padding.p_10,
    alignItems: "center",
  },
  rightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: Gap.gap_10,
  },
  logo: {
    width: 160,
    height: 40,
  },
});

export default React.memo(Header);

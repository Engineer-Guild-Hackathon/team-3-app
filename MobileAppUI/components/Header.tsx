import * as React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { Image } from "expo-image";
import IconButton from "./IconButton";
import { Gap, Color, StyleVariable, Padding } from "../GlobalStyles";

export type HeaderType = {
  /** Variant props */
  drawerOpen?: boolean;
};

const Header = ({ drawerOpen = false }: HeaderType) => {
  return (
    <View style={[styles.header, styles.headerFlexBox]}>
      <View style={styles.safearea} />
      <View style={[styles.topBar, styles.topBarFlexBox]}>
        <View style={[styles.leftgroup, styles.leftgroupFlexBox]}>
          <IconButton />
        </View>
        <View style={[styles.centergroup, styles.leftgroupFlexBox1]}>
          <Image
            style={[styles.sparlogoIcon, styles.leftgroupFlexBox]}
            contentFit="cover"
            source={require("../assets/SPARLogo.png")}
          />
        </View>
        <View style={[styles.rightgroup, styles.leftgroupFlexBox]}>
          <IconButton />
          <IconButton />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerFlexBox: {
    justifyContent: "center",
    overflow: "hidden",
    alignSelf: "stretch",
  },
  topBarFlexBox: {
    gap: Gap.gap_10,
    flexDirection: "row",
    alignItems: "center",
  },
  leftgroupFlexBox: {
    flex: 1,
    overflow: "hidden",
  },
  leftgroupFlexBox1: {
    flexDirection: "row",
    alignItems: "center",
  },
  header: {
    boxShadow: "0px 2px 16px rgba(0, 0, 0, 0.06)",
    shadowColor: Color.colorGray200,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 16,
    elevation: 16,
    shadowOpacity: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  safearea: {
    width: 393,
    height: 44,
    overflow: "hidden",
  },
  topBar: {
    backgroundColor: Color.colorGray100,
    padding: StyleVariable.spaceXs,
    justifyContent: "center",
    overflow: "hidden",
    alignSelf: "stretch",
  },
  leftgroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  centergroup: {
    flex: 0.8198,
    padding: Padding.p_10,
    justifyContent: "center",
    overflow: "hidden",
    alignSelf: "stretch",
  },
  sparlogoIcon: {
    maxWidth: "100%",
    maxHeight: "100%",
    width: "100%",
    alignSelf: "stretch",
    flex: 1,
  },
  rightgroup: {
    justifyContent: "flex-end",
    gap: Gap.gap_10,
    flexDirection: "row",
    alignItems: "center",
  },
});

export default Header;

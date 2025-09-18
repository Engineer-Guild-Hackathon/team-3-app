import * as React from "react";
import { Text, StyleSheet, View } from "react-native";
import UserInfo from "./UserInfo";
import Card1 from "./Card1";
import {
  Gap,
  StyleVariable,
  FontSize,
  FontFamily,
  Color,
} from "../GlobalStyles";

export type HomeMainAreaType = {
  /** Variant props */
  drawerOpen?: boolean;
};

const HomeMainArea = ({ drawerOpen = false }: HomeMainAreaType) => {
  return (
    <View style={[styles.homemainarea, styles.cardFlexBox]}>
      <UserInfo drawerOpen={false} />
      <Card1 drawerOpen={false} cardBorderRadius={12} />
      <View style={[styles.card, styles.cardFlexBox]}>
        <Text style={styles.title}>Stats</Text>
        <View style={[styles.contentarea, styles.cardFlexBox]}>
          <View style={styles.cardcontentslot} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardFlexBox: {
    alignItems: "center",
    overflow: "hidden",
  },
  homemainarea: {
    gap: Gap.gap_30,
    flex: 1,
    alignItems: "center",
    alignSelf: "stretch",
  },
  card: {
    width: 262,
    height: 156,
    padding: StyleVariable.spaceSm,
    gap: StyleVariable.spaceSm,
  },
  title: {
    fontSize: FontSize.size_24,
    lineHeight: 30,
    fontWeight: "800",
    fontFamily: FontFamily.roundedMplus1c,
    color: Color.colorBlack,
    textAlign: "center",
    alignSelf: "stretch",
  },
  contentarea: {
    flex: 1,
    alignItems: "center",
    alignSelf: "stretch",
  },
  cardcontentslot: {
    backgroundColor: Color.colorBlack,
    overflow: "hidden",
    flex: 1,
    alignSelf: "stretch",
  },
});

export default HomeMainArea;

import * as React from "react";
import { StyleSheet, View } from "react-native";
import NewChatButton from "./NewChatButton";
import Card1 from "./Card1";
import { StyleVariable, Color } from "../GlobalStyles";

export type Drawer1Type = {
  /** Variant props */
  drawerOpen?: boolean;
};

const Drawer1 = ({ drawerOpen = false }: Drawer1Type) => {
  return (
    <View style={styles.historydrawer}>
      <NewChatButton drawerOpen={false} />
      <Card1 drawerOpen={false} />
    </View>
  );
};

const styles = StyleSheet.create({
  historydrawer: {
    alignSelf: "stretch",
    flex: 1,
    borderRadius: StyleVariable.radiusMd,
    backgroundColor: Color.colorCornflowerblue100,
    overflow: "hidden",
    alignItems: "center",
    padding: StyleVariable.spaceLg,
    gap: StyleVariable.spaceMd,
  },
});

export default Drawer1;

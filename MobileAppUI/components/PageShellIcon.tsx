import * as React from "react";
import { StyleSheet, View, ImageBackground } from "react-native";
import Header from "./Header";
import ChatMainArea from "./ChatMainArea";
import Drawer1 from "./Drawer1";
import { StyleVariable, Color } from "../GlobalStyles";

export type PageShellIconType = {
  /** Variant props */
  drawerOpen?: boolean;
};

const PageShellIcon = ({ drawerOpen = false }: PageShellIconType) => {
  return (
    <ImageBackground
      style={[styles.layoutpageshellIcon, styles.mainareaFlexBox]}
      resizeMode="cover"
      source={require("../assets/Layout-PageShell.png")}
    >
      <Header drawerOpen={false} />
      <View style={[styles.mainarea, styles.mainareaFlexBox]}>
        <View style={[styles.contentarea, styles.mainareaFlexBox]}>
          <ChatMainArea drawerOpen={false} chatBubbleTheme1="Dark" />
        </View>
        <View style={styles.drawerlayer}>
          <Drawer1 drawerOpen={false} />
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  mainareaFlexBox: {
    flex: 1,
    alignSelf: "stretch",
  },
  layoutpageshellIcon: {
    alignItems: "center",
    padding: StyleVariable.spaceLg,
    gap: StyleVariable.spaceMd,
  },
  mainarea: {
    overflow: "hidden",
  },
  contentarea: {
    flexDirection: "row",
    justifyContent: "center",
    zIndex: 0,
    overflow: "hidden",
  },
  drawerlayer: {
    width: 320,
    position: "absolute",
    top: 0,
    bottom: 0,
    left: -320,
    backgroundColor: Color.colorSurfaceGlass,
    zIndex: 1,
    overflow: "hidden",
  },
});

export default PageShellIcon;

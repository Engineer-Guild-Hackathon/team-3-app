import * as React from "react";
import { ScrollView, StyleSheet, View, ImageBackground } from "react-native";
import Header from "../components/Header";
import HomeMainArea from "../components/HomeMainArea";
import Drawer1 from "../components/Drawer1";
import { Color, StyleVariable } from "../GlobalStyles";

const Home = () => {
  return (
    <ScrollView
      style={styles.home}
      contentContainerStyle={styles.homeScrollViewContent}
    >
      <ImageBackground
        style={[styles.layoutpageshellIcon, styles.mainareaFlexBox]}
        resizeMode="cover"
      >
        <Header drawerOpen={false} />
        <View style={[styles.mainarea, styles.mainareaFlexBox]}>
          <View style={[styles.contentarea, styles.mainareaFlexBox]}>
            <HomeMainArea drawerOpen={false} />
          </View>
          <View style={styles.drawerlayer}>
            <Drawer1 drawerOpen={false} />
          </View>
        </View>
      </ImageBackground>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  homeScrollViewContent: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: 852,
  },
  mainareaFlexBox: {
    alignSelf: "stretch",
    flex: 1,
  },
  home: {
    width: "100%",
    backgroundColor: Color.colorWhite,
    maxWidth: "100%",
    flex: 1,
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

export default Home;

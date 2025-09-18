import * as React from "react";
import {
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PageShellIcon from "../components/PageShellIcon";
import { Color } from "../GlobalStyles";

const Chat = () => {
  return (
    <SafeAreaView style={styles.chatFlexBox}>
      <KeyboardAvoidingView
        style={styles.chatFlexBox}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={[styles.scrollview, styles.chatFlexBox]}
          contentContainerStyle={styles.chatScrollViewContent}
        >
          <PageShellIcon drawerOpen={false} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  chatScrollViewContent: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: 852,
  },
  chatFlexBox: {
    flex: 1,
    width: "100%",
  },
  scrollview: {
    backgroundColor: Color.colorWhite,
    maxWidth: "100%",
  },
});

export default Chat;

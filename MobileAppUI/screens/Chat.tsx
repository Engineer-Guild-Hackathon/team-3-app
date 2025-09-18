import * as React from "react";
import { StyleSheet, Platform, KeyboardAvoidingView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PageShellIcon from "../components/PageShellIcon";

const Chat = () => {
  return (
    <SafeAreaView style={styles.chatFlexBox}>
      <KeyboardAvoidingView
        style={styles.chatFlexBox}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <PageShellIcon />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  chatFlexBox: {
    flex: 1,
    width: "100%",
  },
});

export default Chat;

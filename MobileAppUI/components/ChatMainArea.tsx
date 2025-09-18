import * as React from "react";
import { Text, StyleSheet, View } from "react-native";
import MessageBubble from "./MessageBubble";
import Union2 from "../assets/Union2.svg";
import InputArea from "./InputArea";
import { FontFamily, Color, Gap, Padding, FontSize } from "../GlobalStyles";

export type ChatMainAreaType = {
  chatBubbleTheme1?: string;

  /** Variant props */
  drawerOpen?: boolean;
};

const ChatMainArea = ({
  drawerOpen = false,
  chatBubbleTheme1,
}: ChatMainAreaType) => {
  return (
    <View style={styles.chatmainarea}>
      <View style={styles.messages}>
        <MessageBubble />
        <View style={styles.chatmessagebubble}>
          <View style={styles.chatBubble}>
            <View style={styles.datetimeWrapper}>
              <Text style={[styles.datetime, styles.textTypo]}>12/5 12:00</Text>
            </View>
            <View style={[styles.bubbleLeft, styles.textboxFlexBox]}>
              <View style={styles.rectangleParent}>
                <View style={[styles.frameChild, styles.frameBorder]} />
                <View style={[styles.frameItem, styles.frameBorder]} />
                <View style={[styles.frameInner, styles.frameBorder]} />
              </View>
              <View style={[styles.textWrapper, styles.frameBorder]}>
                <Text style={[styles.text, styles.textTypo]}>
                  Te-to-Te wo tsunaide
                </Text>
              </View>
              <View style={[styles.rectangleGroup, styles.textboxFlexBox]}>
                <View style={[styles.frameChild, styles.frameBorder]} />
                <View style={[styles.frameItem, styles.frameBorder]} />
                <Union2 style={styles.unionIcon} width={35} height={35} />
              </View>
            </View>
          </View>
        </View>
        <MessageBubble />
      </View>
      <View style={[styles.textbox, styles.textboxFlexBox]}>
        <InputArea drawerOpen={false} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  textTypo: {
    textAlign: "left",
    fontFamily: FontFamily.notoSansJPRegular,
  },
  textboxFlexBox: {
    justifyContent: "center",
    alignSelf: "stretch",
  },
  frameBorder: {
    borderWidth: 1,
    borderColor: Color.colorCornflowerblue200,
    borderStyle: "solid",
    backgroundColor: Color.colorCornflowerblue200,
  },
  chatmainarea: {
    gap: Gap.gap_10,
    alignItems: "center",
    overflow: "hidden",
    flex: 1,
    alignSelf: "stretch",
  },
  messages: {
    gap: Gap.gap_20,
    overflow: "hidden",
    flex: 1,
    alignSelf: "stretch",
  },
  chatmessagebubble: {
    justifyContent: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    alignSelf: "stretch",
  },
  chatBubble: {
    width: 300,
    gap: Gap.gap_4,
  },
  datetimeWrapper: {
    paddingLeft: Padding.p_24,
    flexDirection: "row",
  },
  datetime: {
    height: 22,
    width: 70,
    fontSize: FontSize.size_14,
    lineHeight: 22,
    color: Color.colorDimgray,
  },
  bubbleLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  rectangleParent: {
    alignSelf: "stretch",
  },
  frameChild: {
    borderTopLeftRadius: 64,
    borderColor: Color.colorCornflowerblue200,
    borderStyle: "solid",
    backgroundColor: Color.colorCornflowerblue200,
    width: 25,
    flex: 1,
  },
  frameItem: {
    width: 25,
    borderColor: Color.colorCornflowerblue200,
    borderStyle: "solid",
    backgroundColor: Color.colorCornflowerblue200,
    flex: 1,
  },
  frameInner: {
    height: 36,
    borderTopLeftRadius: 64,
    borderColor: Color.colorCornflowerblue200,
    borderStyle: "solid",
    backgroundColor: Color.colorCornflowerblue200,
    width: 25,
  },
  textWrapper: {
    paddingHorizontal: 0,
    paddingVertical: Padding.p_18,
    flexDirection: "row",
    flex: 1,
  },
  text: {
    fontSize: FontSize.size_18,
    lineHeight: 28,
    color: Color.colorWhite,
    flex: 1,
  },
  rectangleGroup: {
    alignItems: "flex-end",
    transform: [
      {
        rotate: "180deg",
      },
    ],
  },
  unionIcon: {
    width: 35,
    height: 35,
    transform: [
      {
        rotate: "-180deg",
      },
    ],
  },
  textbox: {
    alignItems: "center",
    overflow: "hidden",
  },
});

export default ChatMainArea;

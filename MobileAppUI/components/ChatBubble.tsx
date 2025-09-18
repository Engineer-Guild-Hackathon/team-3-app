import React, { useMemo } from "react";
import { Text, StyleSheet, View } from "react-native";
import Union from "../assets/Union.svg";
import { FontFamily, Color, Padding, Gap, FontSize } from "../GlobalStyles";

export type ChatBubbleType = {
  text?: string;

  /** Variant props */
  color?: string;
  mode?: string;
  side?: string;
  theme?: string;

  /** Style props */
  textTextAlign?: string;
};

const getStyleValue = (key: string, value: string | number | undefined) => {
  if (value === undefined) return;
  return { [key]: value === "unset" ? undefined : value };
};
const ChatBubble = ({
  color = "Blue",
  mode = "Recent",
  side = "Left",
  theme = "Dark",
  text,
  textTextAlign,
}: ChatBubbleType) => {
  const text1Style = useMemo(() => {
    return {
      ...getStyleValue("textAlign", textTextAlign),
    };
  }, [textTextAlign]);

  return (
    <View style={styles.chatBubble}>
      <View style={styles.datetimeWrapper}>
        <Text style={[styles.datetime, styles.textTypo]}>12/5 12:00</Text>
      </View>
      <View style={styles.bubbleRight}>
        <View style={styles.rectangleParent}>
          <View style={[styles.frameChild, styles.frameBorder]} />
          <View style={[styles.rightOverlap, styles.frameBorder]} />
          <Union style={styles.unionIcon} width={35} height={35} />
        </View>
        <View style={[styles.textWrapper, styles.frameBorder]}>
          <Text style={[styles.text, styles.textTypo, text1Style]}>{text}</Text>
        </View>
        <View style={styles.rectangleGroup}>
          <View style={[styles.frameItem, styles.frameBorder]} />
          <View style={[styles.rightOverlap, styles.frameBorder]} />
          <View style={[styles.frameChild, styles.frameBorder]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  textTypo: {
    textAlign: "left",
    fontFamily: FontFamily.notoSansJPRegular,
  },
  frameBorder: {
    borderWidth: 1,
    borderColor: Color.colorRoleAssistant,
    borderStyle: "solid",
    backgroundColor: Color.colorRoleAssistant,
  },
  chatBubble: {
    width: 250,
    paddingBottom: Padding.p_10,
    gap: Gap.gap_6,
  },
  datetimeWrapper: {
    paddingLeft: 34,
    flexDirection: "row",
  },
  datetime: {
    height: 22,
    width: 70,
    fontSize: FontSize.size_14,
    lineHeight: 22,
    color: Color.colorDimgray,
  },
  bubbleRight: {
    alignSelf: "stretch",
    flexDirection: "row",
  },
  rectangleParent: {
    alignItems: "flex-end",
    justifyContent: "center",
    alignSelf: "stretch",
  },
  frameChild: {
    borderTopLeftRadius: 64,
    borderColor: Color.colorRoleAssistant,
    borderStyle: "solid",
    backgroundColor: Color.colorRoleAssistant,
    width: 25,
    flex: 1,
  },
  rightOverlap: {
    flex: 1,
    width: 25,
    borderColor: Color.colorRoleAssistant,
    borderStyle: "solid",
    backgroundColor: Color.colorRoleAssistant,
  },
  unionIcon: {
    width: 35,
    height: 35,
  },
  textWrapper: {
    paddingHorizontal: 0,
    paddingVertical: Padding.p_18,
    flex: 1,
    flexDirection: "row",
  },
  text: {
    fontSize: FontSize.size_18,
    lineHeight: 28,
    color: Color.colorBlack,
    flex: 1,
  },
  rectangleGroup: {
    transform: [
      {
        rotate: "180deg",
      },
    ],
    alignSelf: "stretch",
  },
  frameItem: {
    height: 36,
    borderTopLeftRadius: 64,
    borderColor: Color.colorRoleAssistant,
    borderStyle: "solid",
    backgroundColor: Color.colorRoleAssistant,
    width: 25,
  },
});

export default ChatBubble;

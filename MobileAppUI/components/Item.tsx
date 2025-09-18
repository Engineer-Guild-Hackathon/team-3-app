import React, { useMemo } from "react";
import { StyleSheet, View, Text, Pressable } from "react-native";
import Icon1 from "./Icon1";
import UnreadDot from "../assets/UnreadDot.svg";
import {
  Color,
  FontSize,
  FontFamily,
  StyleVariable,
  Padding,
  Gap,
} from "../GlobalStyles";

export type ItemType = {
  showUnreadDotIcon?: boolean;

  /** Variant props */
  selected?: boolean;
  size?: string;

  /** Style props */
  timeWidth?: number | string;
  timeHeight?: number | string;
  timeDisplay?: string;
  timeAlignItems?: string;
  timeJustifyContent?: string;

  /** Action props */
  onItemPress?: () => void;
};

const getStyleValue = (key: string, value: string | number | undefined) => {
  if (value === undefined) return;
  return { [key]: value === "unset" ? undefined : value };
};
const Item = ({
  selected = true,
  size = "default",
  onItemPress,
  showUnreadDotIcon,
  timeWidth,
  timeHeight,
  timeDisplay,
  timeAlignItems,
  timeJustifyContent,
}: ItemType) => {
  const timeStyle = useMemo(() => {
    return {
      ...getStyleValue("width", timeWidth),
      ...getStyleValue("height", timeHeight),
      ...getStyleValue("display", timeDisplay),
      ...getStyleValue("alignItems", timeAlignItems),
      ...getStyleValue("justifyContent", timeJustifyContent),
    };
  }, [timeWidth, timeHeight, timeDisplay, timeAlignItems, timeJustifyContent]);

  return (
    <View
      style={[styles.historyitem, styles.rowtitleFlexBox]}
      onPress={onItemPress}
    >
      <View style={styles.leading}>
        <Icon1 selected={false} size="default" />
      </View>
      <View style={styles.content}>
        <View style={[styles.rowtitle, styles.rowtitleFlexBox]}>
          {!!showUnreadDotIcon && (
            <UnreadDot style={styles.unreaddotIcon} width={8} height={8} />
          )}
          <Text style={[styles.title, styles.subFlexBox]}>
            aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
          </Text>
        </View>
        <Text style={[styles.sub, styles.subTypo]}>aaaaaaaaaaaaaa</Text>
      </View>
      <View style={[styles.trailing, styles.subFlexBox]}>
        <Text style={[styles.time, styles.subTypo, timeStyle]}>12:30</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  rowtitleFlexBox: {
    alignItems: "center",
    alignSelf: "stretch",
    flexDirection: "row",
    overflow: "hidden",
  },
  subFlexBox: {
    alignItems: "flex-end",
    overflow: "hidden",
    alignSelf: "stretch",
  },
  subTypo: {
    color: Color.colorTextSecondary,
    lineHeight: 22,
    fontSize: FontSize.size_14,
    fontFamily: FontFamily.notoSansJPRegular,
  },
  historyitem: {
    borderRadius: StyleVariable.radiusMd1,
    backgroundColor: Color.colorChatDefault,
    paddingHorizontal: StyleVariable.space16,
    paddingVertical: StyleVariable.space8,
    gap: StyleVariable.space12,
    justifyContent: "center",
  },
  leading: {
    flexDirection: "row",
    overflow: "hidden",
  },
  content: {
    paddingHorizontal: Padding.p_10,
    paddingTop: Padding.p_10,
    paddingBottom: Padding.p_4,
    gap: StyleVariable.space4,
    flex: 1,
    overflow: "hidden",
  },
  rowtitle: {
    height: 20,
    gap: Gap.gap_8,
  },
  unreaddotIcon: {
    width: 8,
    height: 8,
  },
  title: {
    fontSize: FontSize.size_18,
    lineHeight: 28,
    color: Color.colorTextPrimary,
    display: "flex",
    textAlign: "left",
    alignItems: "flex-end",
    fontFamily: FontFamily.notoSansJPRegular,
    flex: 1,
  },
  sub: {
    height: 22,
    alignItems: "flex-end",
    overflow: "hidden",
    alignSelf: "stretch",
    display: "flex",
    textAlign: "left",
  },
  trailing: {
    padding: Padding.p_10,
    justifyContent: "center",
  },
  time: {
    textAlign: "center",
  },
});

export default Item;

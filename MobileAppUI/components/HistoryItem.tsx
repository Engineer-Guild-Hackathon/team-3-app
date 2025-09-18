import * as React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import UnreadDot from "../assets/UnreadDot.svg";
import {
  Color,
  FontSize,
  FontFamily,
  StyleVariable,
  Padding,
  Gap,
} from "../GlobalStyles";
import Avatar from "./Avatar";
import type { ChatHistoryEntry } from "./types";

export type HistoryItemProps = ChatHistoryEntry & {
  isActive?: boolean;
  onPress?: () => void;
};

const HistoryItem = ({
  title,
  snippet,
  timestamp,
  unread,
  isActive = false,
  onPress,
}: HistoryItemProps) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        isActive && styles.active,
        pressed && styles.pressed,
      ]}
      android_ripple={{ color: Color.colorChatTapped }}
      accessibilityRole="button"
      accessibilityLabel={`${title}${unread ? " 未読" : ""}`}
    >
      <View style={styles.leading}>
        <Avatar size={StyleVariable.iconSizeLg} />
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          {unread ? <UnreadDot style={styles.unreadDot} width={8} height={8} /> : null}
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>
        </View>
        {snippet ? (
          <Text numberOfLines={1} style={styles.subtitle}>
            {snippet}
          </Text>
        ) : null}
      </View>
      {timestamp ? (
        <View style={styles.trailing}>
          <Text style={styles.timestamp}>{timestamp}</Text>
        </View>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: StyleVariable.radiusMd1,
    backgroundColor: Color.colorChatDefault,
    paddingHorizontal: StyleVariable.space16,
    paddingVertical: StyleVariable.space8,
    gap: StyleVariable.space12,
  },
  active: {
    backgroundColor: Color.colorChatDefault,
  },
  pressed: {
    backgroundColor: Color.colorChatTapped,
  },
  leading: {
    flexDirection: "row",
    alignItems: "center",
  },
  content: {
    flex: 1,
    gap: StyleVariable.space4,
    paddingHorizontal: Padding.p_10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Gap.gap_4,
  },
  unreadDot: {
    width: 8,
    height: 8,
  },
  title: {
    flex: 1,
    fontSize: FontSize.size_18,
    lineHeight: 28,
    color: Color.colorTextPrimary,
    fontFamily: FontFamily.notoSansJPRegular,
  },
  subtitle: {
    fontSize: FontSize.size_14,
    lineHeight: 22,
    color: Color.colorTextSecondary,
    fontFamily: FontFamily.notoSansJPRegular,
  },
  trailing: {
    paddingHorizontal: Padding.p_10,
    alignItems: "flex-end",
  },
  timestamp: {
    fontSize: FontSize.size_14,
    lineHeight: 22,
    color: Color.colorTextSecondary,
    fontFamily: FontFamily.notoSansJPRegular,
    textAlign: "center",
  },
});

export default React.memo(HistoryItem);

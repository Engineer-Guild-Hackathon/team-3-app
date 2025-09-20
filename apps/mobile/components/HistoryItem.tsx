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
import { formatHistoryTimestampParts } from "../utils/datetime";
import type { ChatHistoryEntry } from "./types";
import { ASSISTANT_STATUS_META } from "../utils/status";

export type HistoryItemProps = ChatHistoryEntry & {
  isActive?: boolean;
  onPress?: () => void;
};

const HistoryItem = ({
  title,
  snippet,
  timestamp,
  unread,
  lastAssistantStatus,
  isActive = false,
  onPress,
}: HistoryItemProps) => {
  // 時刻表示を日付/時間に分割し再利用
  const timestampParts = React.useMemo(
    () => formatHistoryTimestampParts(timestamp),
    [timestamp],
  );
  // 未読の返信待ち状態かどうかを簡潔に判定
  const showUnreadIndicator = unread && lastAssistantStatus === -1;
  const statusMeta =
    typeof lastAssistantStatus === "number"
      ? ASSISTANT_STATUS_META[lastAssistantStatus]
      : undefined;
  const accessibilityLabel = React.useMemo(
    () => `${title}${unread ? " 未読" : ""}`,
    [title, unread],
  );

  return (
    // 履歴一件分をタップ可能なカードとして表示
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        isActive && styles.active,
        pressed && styles.pressed,
      ]}
      android_ripple={{ color: Color.colorChatTapped }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={styles.content}>
        <View style={styles.titleRow}>
          {showUnreadIndicator ? (
            <UnreadDot style={styles.unreadDot} width={8} height={8} />
          ) : null}
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>
          {statusMeta ? (
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: statusMeta.badgeBackground,
                  borderColor: statusMeta.badgeBorder,
                },
              ]}
            >
              <Text style={[styles.statusText, { color: statusMeta.badgeText }]}>
                {statusMeta.label}
              </Text>
            </View>
          ) : null}
        </View>
        {snippet ? (
          <Text numberOfLines={1} style={styles.subtitle}>
            {snippet}
          </Text>
        ) : null}
      </View>
      {timestampParts ? (
        <View style={styles.trailing}>
          <Text numberOfLines={1} style={styles.timestampDate}>
            {timestampParts.date}
          </Text>
          {timestampParts.time ? (
            <Text numberOfLines={1} style={styles.timestampTime}>
              {timestampParts.time}
            </Text>
          ) : null}
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
  content: {
    flex: 1,
    gap: StyleVariable.space4,
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
  statusBadge: {
    marginLeft: Gap.gap_4,
    borderRadius: StyleVariable.radiusMd,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: StyleVariable.spaceSm,
    paddingVertical: StyleVariable.space4,
  },
  statusText: {
    fontSize: 10,
    fontFamily: FontFamily.notoSansJPRegular,
    fontWeight: "600",
    letterSpacing: 0.5,
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
    justifyContent: "center",
    gap: StyleVariable.space4,
  },
  timestampDate: {
    fontSize: FontSize.size_14,
    lineHeight: 20,
    color: Color.colorTextSecondary,
    fontFamily: FontFamily.notoSansJPRegular,
    textAlign: "center",
  },
  timestampTime: {
    fontSize: FontSize.size_14,
    lineHeight: 20,
    color: Color.colorTextSecondary,
    fontFamily: FontFamily.notoSansJPRegular,
    textAlign: "center",
  },
});

export default React.memo(HistoryItem);

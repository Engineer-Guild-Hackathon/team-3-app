import * as React from "react";
import {
  FlatList,
  ListRenderItem,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { Color, Gap, Padding, StyleVariable } from "../GlobalStyles";
import ChatBubble from "./ChatBubble";
import type { ChatMessage } from "./types";
import { getSampleChatMessages } from "../utils/sampleData";
import ScrollDown from "../assets/ScrollDown.svg";

export type ChatAreaProps = {
  messages?: ChatMessage[];
  onBottomStateChange?: (isAtBottom: boolean) => void;
};

export type ChatAreaHandle = {
  scrollToEnd: (options?: { animated?: boolean }) => void;
};

// 底まで到達したとみなすオフセットの許容値
const SCROLL_BOTTOM_THRESHOLD = 32;

const ChatArea = React.forwardRef<ChatAreaHandle, ChatAreaProps>(
  ({ messages = [], onBottomStateChange }, ref) => {
    const listRef = React.useRef<FlatList<ChatMessage>>(null);
    const isAtBottomRef = React.useRef(true);
    const [isAtBottom, setIsAtBottom] = React.useState(true);

    // データ未指定時はサンプルを提示して UI を確認しやすくする
    const fallbackMessages = React.useMemo(() => getSampleChatMessages(), []);
    const data = messages.length > 0 ? messages : fallbackMessages;

    // 共通のスクロール末尾処理を一箇所で管理
    const scrollToLatest = React.useCallback(
      (animated = true) => {
        listRef.current?.scrollToEnd({ animated });
      },
      [],
    );

    // 最終メッセージの状態変化を検知するためのキーを生成
    const lastMessageKey = React.useMemo(() => {
      if (data.length === 0) {
        return "empty";
      }
      const last = data[data.length - 1];
      const pendingKey = last.pending ? "pending" : "done";
      const statusKey = last.status ?? "unknown";
      return `${last.id}|${last.text}|${pendingKey}|${statusKey}`;
    }, [data]);

    React.useImperativeHandle(
      ref,
      () => ({
        scrollToEnd: ({ animated = true } = {}) => {
          scrollToLatest(animated);
        },
      }),
      [scrollToLatest],
    );

    React.useEffect(() => {
      onBottomStateChange?.(isAtBottom);
    }, [isAtBottom, onBottomStateChange]);

    React.useEffect(() => {
      if (!isAtBottomRef.current) {
        return;
      }
      const frame = requestAnimationFrame(() => {
        scrollToLatest(true);
      });
      const timeout = setTimeout(() => {
        scrollToLatest(true);
      }, 180);

      return () => {
        cancelAnimationFrame(frame);
        clearTimeout(timeout);
      };
    }, [lastMessageKey, scrollToLatest]);

    // ユーザーのスクロール位置から最下部にいるかを判定
    const updateScrollPosition = React.useCallback(
      (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        const distanceFromBottom =
          contentSize.height - (layoutMeasurement.height + contentOffset.y);
        const nearBottom = distanceFromBottom <= SCROLL_BOTTOM_THRESHOLD;

        if (nearBottom !== isAtBottomRef.current) {
          isAtBottomRef.current = nearBottom;
          setIsAtBottom(nearBottom);
        }
      },
      [],
    );

    const handleContentSizeChange = React.useCallback(() => {
      if (isAtBottomRef.current) {
        scrollToLatest(true);
      }
    }, [scrollToLatest]);

    const handleScrollToBottom = React.useCallback(() => {
      scrollToLatest(true);
      if (!isAtBottomRef.current) {
        isAtBottomRef.current = true;
        setIsAtBottom(true);
      }
    }, [scrollToLatest]);

    // メッセージごとのラッパーに揃えた余白を付与
    const renderItem = React.useCallback<ListRenderItem<ChatMessage>>(
      ({ item }) => (
        <View style={styles.itemContainer}>
          <ChatBubble message={item} />
        </View>
      ),
      [],
    );

    return (
      <View style={styles.wrapper}>
        <FlatList
          ref={listRef}
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={styles.messageContainer}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListFooterComponent={<View style={styles.footerSpacer} />}
          showsVerticalScrollIndicator={false}
          onScroll={updateScrollPosition}
          scrollEventThrottle={16}
          onContentSizeChange={handleContentSizeChange}
        />
        {isAtBottom ? null : (
          // 最新メッセージへ戻るためのショートカットボタン
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="scroll to latest message"
            style={({ pressed }) => [styles.scrollButton, pressed && styles.scrollButtonPressed]}
            onPress={handleScrollToBottom}
          >
            <ScrollDown width={StyleVariable.iconSizeLg} height={StyleVariable.iconSizeLg} />
          </Pressable>
        )}
      </View>
    );
  },
);

ChatArea.displayName = "ChatArea";

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  messageContainer: {
    paddingHorizontal: Padding.p_24,
    paddingVertical: Padding.p_18,
  },
  itemContainer: {
    alignSelf: "stretch",
  },
  separator: {
    height: Gap.gap_10,
  },
  footerSpacer: {
    height: Padding.p_24,
  },
  scrollButton: {
    position: "absolute",
    right: Padding.p_24,
    bottom: Padding.p_24,
    width: StyleVariable.iconSizeXl,
    height: StyleVariable.iconSizeXl,
    borderRadius: StyleVariable.iconSizeXl / 2,
    backgroundColor: Color.colorBrandPrimary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Color.colorBlack,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 6,
  },
  scrollButtonPressed: {
    opacity: 0.75,
  },
});

export default React.memo(ChatArea);

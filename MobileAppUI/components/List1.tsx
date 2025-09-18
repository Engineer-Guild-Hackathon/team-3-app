import React, { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import Item from "./Item";

export type List1Type = {
  /** Variant props */
  bgStyle?: string;
  hasTitle?: boolean;
};

const List1 = ({ bgStyle = "transparent", hasTitle = true }: List1Type) => {
  const [itemItems] = useState([
    {
      selected: false,
      size: "default",
      showUnreadDotIcon: true,
      timeWidth: "",
      timeHeight: "",
      timeDisplay: "",
      timeAlignItems: "",
      timeJustifyContent: "",
    },
    {
      selected: false,
      size: "default",
      showUnreadDotIcon: true,
      timeWidth: "",
      timeHeight: "",
      timeDisplay: "",
      timeAlignItems: "",
      timeJustifyContent: "",
    },
    {
      selected: false,
      size: "default",
      showUnreadDotIcon: true,
      timeWidth: "",
      timeHeight: "",
      timeDisplay: "",
      timeAlignItems: "",
      timeJustifyContent: "",
    },
    {
      selected: false,
      size: "default",
      showUnreadDotIcon: false,
      timeWidth: "",
      timeHeight: "",
      timeDisplay: "",
      timeAlignItems: "",
      timeJustifyContent: "",
    },
    {
      selected: false,
      size: "default",
      showUnreadDotIcon: false,
      timeWidth: "",
      timeHeight: "",
      timeDisplay: "",
      timeAlignItems: "",
      timeJustifyContent: "",
    },
    {
      selected: false,
      size: "default",
      showUnreadDotIcon: false,
      timeWidth: "",
      timeHeight: "",
      timeDisplay: "",
      timeAlignItems: "",
      timeJustifyContent: "",
    },
    {
      selected: false,
      size: "default",
      showUnreadDotIcon: false,
      timeWidth: "",
      timeHeight: "",
      timeDisplay: "",
      timeAlignItems: "",
      timeJustifyContent: "",
    },
    {
      selected: false,
      size: "default",
      showUnreadDotIcon: false,
      timeWidth: "",
      timeHeight: "",
      timeDisplay: "",
      timeAlignItems: "",
      timeJustifyContent: "",
    },
    {
      selected: false,
      size: "default",
      showUnreadDotIcon: false,
      timeWidth: "",
      timeHeight: "",
      timeDisplay: "",
      timeAlignItems: "",
      timeJustifyContent: "",
    },
    {
      selected: false,
      size: "default",
      showUnreadDotIcon: false,
      timeWidth: "",
      timeHeight: "",
      timeDisplay: "",
      timeAlignItems: "",
      timeJustifyContent: "",
    },
    {
      selected: false,
      size: "default",
      showUnreadDotIcon: false,
      timeWidth: "",
      timeHeight: "",
      timeDisplay: "",
      timeAlignItems: "",
      timeJustifyContent: "",
    },
    {
      selected: false,
      size: "default",
      showUnreadDotIcon: false,
      timeWidth: "",
      timeHeight: "",
      timeDisplay: "",
      timeAlignItems: "",
      timeJustifyContent: "",
    },
  ]);

  return (
    <ScrollView
      style={styles.historylist}
      contentContainerStyle={styles.listContainerContent}
    >
      {itemItems.map((item, index) => (
        <Item
          key={index}
          selected={item.selected}
          size={item.size}
          showUnreadDotIcon={item.showUnreadDotIcon}
          timeWidth={item.timeWidth}
          timeHeight={item.timeHeight}
          timeDisplay={item.timeDisplay}
          timeAlignItems={item.timeAlignItems}
          timeJustifyContent={item.timeJustifyContent}
        />
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  listContainerContent: {
    flexDirection: "column",
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
  },
  historylist: {
    alignSelf: "stretch",
    flex: 1,
    maxWidth: "100%",
  },
});

export default List1;

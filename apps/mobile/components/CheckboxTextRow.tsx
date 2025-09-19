import * as React from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  TextStyle,
  ViewStyle,
} from "react-native";

import Checkbox, { CheckboxProps } from "./Checkbox";

export type CheckboxTextRowProps = Omit<
  CheckboxProps,
  "label" | "description" | "contentStyle" | "labelStyle" | "descriptionStyle"
> & {
  text: string;
  textStyle?: StyleProp<TextStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

const CheckboxTextRow = React.forwardRef<
  React.ElementRef<typeof Pressable>,
  CheckboxTextRowProps
>(
  (
    {
      text,
      textStyle,
      contentStyle,
      containerStyle,
      helperTextStyle,
      ...checkboxProps
    },
    ref,
  ) => {
    return (
      <Checkbox
        {...checkboxProps}
        ref={ref}
        label={text}
        containerStyle={[containerStyle]}
        contentStyle={[styles.content, contentStyle]}
        labelStyle={[styles.text, textStyle]}
        helperTextStyle={helperTextStyle}
      />
    );
  },
);

CheckboxTextRow.displayName = "CheckboxTextRow";

const styles = StyleSheet.create({
  content: {
    alignItems: "flex-end",
  },
  text: {
    flexShrink: 1,
  },
});

export default React.memo(CheckboxTextRow);

import * as React from "react";
import { StyleSheet, TextInput, View } from "react-native";

import {
  StyleVariable,
  Color,
  Padding,
  Gap,
  Border,
  FontFamily,
  FontSize,
} from "../GlobalStyles";
import SendButton from "./SendButton";

export type InputAreaProps = {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  onChangeText?: (text: string) => void;
  onSend?: (text: string) => void;
};

const InputArea = React.forwardRef<TextInput, InputAreaProps>(
  ({
    value,
    defaultValue = "",
    placeholder = "メッセージを入力...",
    onChangeText,
    onSend,
  }, ref) => {
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = React.useState(defaultValue);

    React.useEffect(() => {
      if (isControlled) {
        setInternalValue(value ?? "");
      }
    }, [isControlled, value]);

    const textValue = isControlled ? value ?? "" : internalValue;

    const handleChange = (text: string) => {
      if (!isControlled) {
        setInternalValue(text);
      }
      onChangeText?.(text);
    };

    const handleSend = () => {
      const trimmed = textValue.trim();
      if (!trimmed) return;
      onSend?.(trimmed);
      if (!isControlled) {
        setInternalValue("");
      }
    };

    return (
      <View style={styles.container}>
        <TextInput
          ref={ref}
          style={styles.input}
          value={textValue}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={Color.colorTextSecondary}
          multiline
          numberOfLines={2}
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <SendButton onPress={handleSend} />
      </View>
    );
  },
);

InputArea.displayName = "InputArea";

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: StyleVariable.radiusMd,
    backgroundColor: Color.colorSurfaceGlass,
    flexDirection: "row",
    alignItems: "center",
    padding: Padding.p_10,
    gap: Gap.gap_10,
  },
  input: {
    flex: 1,
    borderRadius: Border.br_4,
    padding: StyleVariable.spaceSm,
    fontFamily: FontFamily.notoSansJPRegular,
    fontSize: FontSize.size_18,
  },
});

export default React.memo(InputArea);

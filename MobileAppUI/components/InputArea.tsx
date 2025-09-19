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

export type InputAreaStatus = "default" | "waiting" | "completed";

export type InputAreaProps = {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  onChangeText?: (text: string) => void;
  onSend?: (text: string) => void;
  status?: InputAreaStatus;
  onFocus?: () => void;
};

const InputArea = React.forwardRef<TextInput, InputAreaProps>(
  ({
    value,
    defaultValue = "",
    placeholder = "メッセージを入力...",
    onChangeText,
    onSend,
    status = "default",
    onFocus,
  }, ref) => {
    const inputRef = React.useRef<TextInput>(null);
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = React.useState(defaultValue);

    React.useImperativeHandle(ref, () => inputRef.current as TextInput);

    React.useEffect(() => {
      if (isControlled) {
        setInternalValue(value ?? "");
      }
    }, [isControlled, value]);

    const textValue = isControlled ? value ?? "" : internalValue;

    const isWaiting = status === "waiting";
    const isCompleted = status === "completed";

    const handleChange = (text: string) => {
      if (!isControlled) {
        setInternalValue(text);
      }
      onChangeText?.(text);
    };

    const handleSend = () => {
      if (status !== "default") {
        return;
      }
      const trimmed = textValue.trim();
      if (!trimmed) return;
      onSend?.(trimmed);
      onChangeText?.("");
      if (!isControlled) {
        setInternalValue("");
      }
      inputRef.current?.clear();
      inputRef.current?.setNativeProps({ text: "" });
    };

    React.useEffect(() => {
      if (status !== "default") {
        if (!isControlled) {
          setInternalValue("");
        }
        inputRef.current?.clear();
        inputRef.current?.setNativeProps({ text: "" });
      }
    }, [status, isControlled]);

    if (isCompleted) {
      return null;
    }

    return (
      <View style={[styles.container, isWaiting ? styles.containerWaiting : null]}>
        <TextInput
          ref={inputRef}
          style={[styles.input, isWaiting ? styles.inputWaiting : null]}
          value={textValue}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={Color.colorTextSecondary}
          multiline
          numberOfLines={2}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          editable={!isWaiting}
          selectTextOnFocus={!isWaiting}
          onFocus={onFocus}
        />
        <SendButton onPress={handleSend} disabled={status !== "default"} />
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
  containerWaiting: {
    backgroundColor: Color.colorRoleAssistant,
  },
  input: {
    flex: 1,
    borderRadius: Border.br_4,
    padding: StyleVariable.spaceSm,
    fontFamily: FontFamily.notoSansJPRegular,
    fontSize: FontSize.size_18,
  },
  inputWaiting: {
    color: Color.colorDimgray,
  },
});

export default React.memo(InputArea);

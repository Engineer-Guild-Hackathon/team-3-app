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
    // value を受け取っているかで制御コンポーネントとして扱うかを判断
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = React.useState(defaultValue);
    // ネイティブ側の入力フィールドを確実にクリアする処理を共通化
    const clearNativeInput = React.useCallback(() => {
      inputRef.current?.clear();
      inputRef.current?.setNativeProps({ text: "" });
    }, []);

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

    // 完了以外の状態のみ送信を許可し、送信後は即座にリセット
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
      clearNativeInput();
    };

    React.useEffect(() => {
      if (status !== "default") {
        if (!isControlled) {
          setInternalValue("");
        }
        clearNativeInput();
      }
    }, [clearNativeInput, status, isControlled]);

    // 完了状態では入力欄自体を隠す
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
          textAlignVertical="top"
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

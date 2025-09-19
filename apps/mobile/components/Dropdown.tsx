import * as React from "react";
import {
  BackHandler,
  FlatList,
  ListRenderItemInfo,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  Border,
  Color,
  FontFamily,
  FontSize,
  Gap,
  StyleVariable,
} from "../GlobalStyles";

export type DropdownOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

export type DropdownProps = {
  options: DropdownOption[];
  value?: string;
  placeholder?: string;
  label?: string;
  helperText?: string;
  disabled?: boolean;
  onSelect?: (value: string) => void;
  onOpen?: () => void;
  onClose?: () => void;
  testID?: string;
};

const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  placeholder = "選択してください",
  label,
  helperText,
  disabled = false,
  onSelect,
  onOpen,
  onClose,
  testID,
}) => {
  const [visible, setVisible] = React.useState(false);

  const currentOption = React.useMemo(() => {
    return options.find((option) => option.value === value) ?? null;
  }, [options, value]);

  const closeDropdown = React.useCallback(() => {
    setVisible(false);
    onClose?.();
  }, [onClose]);

  const handleOpen = React.useCallback(() => {
    if (disabled || visible) {
      return;
    }
    setVisible(true);
    onOpen?.();
  }, [disabled, onOpen, visible]);

  const handleSelect = React.useCallback(
    (option: DropdownOption) => {
      if (option.disabled) {
        return;
      }
      closeDropdown();
      onSelect?.(option.value);
    },
    [closeDropdown, onSelect],
  );

  React.useEffect(() => {
    if (!visible) {
      return;
    }
    // Android の戻るボタン操作でもモーダルを閉じられるようにする
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      closeDropdown();
      return true;
    });

    return () => {
      subscription.remove();
    };
  }, [closeDropdown, visible]);

  const renderOption = React.useCallback(
    ({ item }: ListRenderItemInfo<DropdownOption>) => {
      const isSelected = item.value === value;
      const isDisabled = !!item.disabled;

      return (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: isDisabled, selected: isSelected }}
          onPress={() => handleSelect(item)}
          disabled={isDisabled}
          style={({ pressed }) => [
            styles.option,
            isSelected ? styles.optionSelected : null,
            pressed && !isDisabled ? styles.optionPressed : null,
            isDisabled ? styles.optionDisabled : null,
          ]}
        >
          <Text
            style={[styles.optionLabel, isSelected ? styles.optionLabelSelected : null, isDisabled ? styles.optionLabelDisabled : null]}
          >
            {item.label}
          </Text>
          {item.description ? (
            <Text
              style={[
                styles.optionDescription,
                isDisabled ? styles.optionDescriptionDisabled : null,
              ]}
            >
              {item.description}
            </Text>
          ) : null}
        </Pressable>
      );
    },
    [handleSelect, value],
  );

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled, expanded: visible }}
        accessibilityLabel={label ?? placeholder}
        testID={testID}
        onPress={handleOpen}
        disabled={disabled}
        style={({ pressed }) => [
          styles.field,
          disabled ? styles.fieldDisabled : null,
          pressed && !disabled ? styles.fieldPressed : null,
        ]}
      >
        <Text style={[styles.valueText, !currentOption ? styles.placeholderText : null]}>
          {currentOption ? currentOption.label : placeholder}
        </Text>
        <View style={styles.caretContainer}>
          <View style={styles.caret} />
        </View>
      </Pressable>
      {helperText ? <Text style={styles.helper}>{helperText}</Text> : null}

      <Modal
        animationType="fade"
        transparent
        visible={visible}
        onRequestClose={closeDropdown}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={closeDropdown} />
          <View style={styles.dropdownContainer}>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={renderOption}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    gap: Gap.gap_4,
  },
  label: {
    fontFamily: FontFamily.notoSansJPRegular,
    fontSize: FontSize.size_14,
    color: Color.colorTextSecondary,
  },
  field: {
    minHeight: 48,
    borderRadius: Border.br_12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Color.colorGray200,
    backgroundColor: Color.colorSurfaceGlass,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: StyleVariable.spaceMd,
  },
  fieldDisabled: {
    opacity: 0.6,
  },
  fieldPressed: {
    opacity: 0.8,
  },
  valueText: {
    flex: 1,
    fontFamily: FontFamily.notoSansJPRegular,
    fontSize: FontSize.size_18,
    color: Color.colorTextPrimary,
  },
  placeholderText: {
    color: Color.colorDimgray,
  },
  caretContainer: {
    marginLeft: StyleVariable.spaceSm,
    justifyContent: "center",
    alignItems: "center",
  },
  caret: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: Color.colorTextSecondary,
  },
  helper: {
    fontFamily: FontFamily.notoSansJPRegular,
    fontSize: FontSize.size_14,
    color: Color.colorTextSecondary,
  },
  modalRoot: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: StyleVariable.spaceLg,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.3)",
  },
  dropdownContainer: {
    backgroundColor: Color.colorWhite,
    borderRadius: Border.br_16,
    paddingVertical: StyleVariable.spaceSm,
    shadowColor: Color.colorBlack,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    maxHeight: 320,
  },
  listContent: {
    paddingVertical: StyleVariable.space4,
  },
  option: {
    paddingHorizontal: StyleVariable.spaceLg,
    paddingVertical: StyleVariable.spaceSm,
    gap: Gap.gap_4,
  },
  optionSelected: {
    backgroundColor: Color.colorChatTapped,
  },
  optionPressed: {
    backgroundColor: Color.highlightLightest,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionLabel: {
    fontFamily: FontFamily.notoSansJPRegular,
    fontSize: FontSize.size_18,
    color: Color.colorTextPrimary,
  },
  optionLabelSelected: {
    color: Color.colorBrandPrimary,
  },
  optionLabelDisabled: {
    color: Color.colorDimgray,
  },
  optionDescription: {
    fontFamily: FontFamily.notoSansJPRegular,
    fontSize: FontSize.size_14,
    color: Color.colorTextSecondary,
  },
  optionDescriptionDisabled: {
    color: Color.colorDimgray,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Color.colorGray200,
  },
});

export default React.memo(Dropdown);

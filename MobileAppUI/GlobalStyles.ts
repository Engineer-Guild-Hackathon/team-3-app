import { StyleSheet } from "react-native";

/* Fonts */
export const FontFamily = {
  roundedMplus1c: "Rounded Mplus 1c",
  notoSansJPRegular: "NotoSansJP-Regular",
};
/* Font sizes */
export const FontSize = {
  size_14: 14,
  size_18: 18,
  size_24: 24,
};
/* Colors */
export const Color = {
  colorDimgray: "#64636a",
  colorCornflowerblue200: "#6b93ed",
  colorCornflowerblue100: "#93b3ff",
  colorBlack: "#000",
  colorGray200: "rgba(0, 0, 0, 0.06)",
  colorGray100: "rgba(0, 0, 0, 0)",
  colorWhite: "#fff",
  highlightLightest: "#eaf2ff",
  colorRoleAssistant: "#d5d5d5",
  colorBrandSecondary: "#6a93ed",
  colorSurfaceGlass: "rgba(255, 255, 255, 0.8)",
  colorTextSecondary: "#475569",
  colorTextPrimary: "#0f172a",
  colorInfoNew: "#22c55e",
  colorChatDefault: "#aec1ff",
  colorBrandPrimary: "#2563eb",
};
/* Style Variables */
export const StyleVariable = {
  space4: 4,
  spaceXs: 4,
  spaceSm: 8,
  space8: 8,
  spaceMd: 12,
  radiusMd: 12,
  radiusMd1: 12,
  space12: 12,
  spaceLg: 16,
  space16: 16,
  radiusLg: 16,
  iconSizeLg: 32,
  iconSizeXl: 48,
};
/* Gaps */
export const Gap = {
  gap_2: 2,
  gap_4: 4,
  gap_6: 6,
  gap_8: 8,
  gap_10: 10,
  gap_20: 20,
  gap_30: 30,
};
/* Paddings */
export const Padding = {
  p_4: 4,
  p_10: 10,
  p_18: 18,
  p_24: 24,
};
/* border radiuses */
export const Border = {
  br_4: 4,
  br_12: 12,
  br_16: 16,
};

export const GlassStyle = StyleSheet.create({
  surface: {
    backgroundColor: Color.colorSurfaceGlass,
    borderRadius: StyleVariable.radiusLg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.6)",
    shadowColor: Color.colorGray200,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 12,
    overflow: "hidden",
  },
});

import type { ImageStyle, StyleProp } from "react-native";
import type { ImageProps } from "expo-image";

import type { IconButtonProps } from "./IconButton";

export type HeaderButtonConfig = IconButtonProps;

export type HeaderLogoConfig = {
  source: ImageProps["source"];
  style?: StyleProp<ImageStyle>;
  contentFit?: ImageProps["contentFit"];
  accessibilityLabel?: string;
};

export type HeaderConfig = {
  menu?: HeaderButtonConfig | null;
  actions?: HeaderButtonConfig[];
  logo?: HeaderLogoConfig;
};

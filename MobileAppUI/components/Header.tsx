import * as React from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";

import IconButton from "./IconButton";
import { Gap, Color, StyleVariable, Padding } from "../GlobalStyles";
import type { HeaderConfig, HeaderButtonConfig, HeaderLogoConfig } from "./headerTypes";
import { defaultHeaderConfig } from "./headerConfigs";

export type HeaderProps = {
  config?: HeaderConfig;
};

const resolveButton = (
  button?: HeaderButtonConfig | null,
  fallback?: HeaderButtonConfig | null,
): HeaderButtonConfig | null => button ?? fallback ?? null;

const resolveActions = (
  actions?: HeaderButtonConfig[],
  fallback?: HeaderButtonConfig[],
): HeaderButtonConfig[] => actions ?? fallback ?? [];

const resolveLogo = (
  logo?: HeaderLogoConfig,
  fallback?: HeaderLogoConfig,
): HeaderLogoConfig | null => {
  if (!logo && !fallback) {
    return null;
  }
  return { ...fallback, ...logo } as HeaderLogoConfig;
};

const Header = ({ config }: HeaderProps) => {
  // 各画面の設定を統合してヘッダー表示内容を決定
  const resolvedMenu = resolveButton(config?.menu, defaultHeaderConfig.menu);
  const resolvedActions = resolveActions(config?.actions, defaultHeaderConfig.actions);
  const resolvedLogo = resolveLogo(config?.logo, defaultHeaderConfig.logo);

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View style={styles.leftGroup}>
          {resolvedMenu ? <IconButton {...resolvedMenu} /> : null}
        </View>
        <View style={styles.centerGroup}>
          {resolvedLogo ? (
            <Image
              style={[styles.logo, resolvedLogo.style]}
              contentFit={resolvedLogo.contentFit ?? "contain"}
              source={resolvedLogo.source}
              accessibilityLabel={resolvedLogo.accessibilityLabel}
            />
          ) : null}
        </View>
        <View style={styles.rightGroup}>
          {resolvedActions.map((button, index) => (
            <IconButton key={index} {...button} />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: "stretch",
    backgroundColor: Color.colorGray100,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Color.colorGray200,
    boxShadow: "0px 2px 16px rgba(0, 0, 0, 0.06)",
    shadowColor: Color.colorGray200,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 16,
    elevation: 16,
    shadowOpacity: 1,
  },
  topBar: {
    paddingHorizontal: StyleVariable.spaceLg,
    paddingVertical: StyleVariable.spaceSm,
    flexDirection: "row",
    alignItems: "center",
    gap: Gap.gap_10,
  },
  leftGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  centerGroup: {
    flex: 1,
    paddingHorizontal: Padding.p_10,
    alignItems: "center",
    justifyContent: "center",
  },
  rightGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: Gap.gap_10,
  },
  logo: {
    width: 160,
    height: 40,
  },
});

export default React.memo(Header);

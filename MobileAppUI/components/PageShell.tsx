import * as React from "react";
import {
  Animated,
  GestureResponderEvent,
  ImageBackground,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "./Header";
import HomeIcon from "../assets/Home.svg";
import SettingIcon from "../assets/Setting.svg";
import { Color, StyleVariable } from "../GlobalStyles";
import { defaultHeaderConfig } from "./headerConfigs";
import type { HeaderButtonConfig, HeaderConfig, HeaderLogoConfig } from "./headerTypes";

export type PageShellRightAction = "settings" | "home";

export type PageShellProps = {
  children?: React.ReactNode;
  headerConfig?: HeaderConfig;
  backgroundStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  rightActionVariant?: PageShellRightAction;
  drawer?: React.ReactNode;
  drawerWidth?: number;
  drawerTransitionDuration?: number;
};

const resolveButton = (
  button?: HeaderButtonConfig | null,
  fallback?: HeaderButtonConfig | null,
): HeaderButtonConfig | null => {
  if (!button && !fallback) {
    return null;
  }
  if (!button) {
    return fallback ? { ...fallback } : null;
  }
  return { ...fallback, ...button } as HeaderButtonConfig;
};

const resolveLogo = (
  logo?: HeaderLogoConfig,
  fallback?: HeaderLogoConfig,
): HeaderLogoConfig | null => {
  if (!logo && !fallback) {
    return null;
  }
  return { ...fallback, ...logo } as HeaderLogoConfig;
};

const ensureRightAction = (
  actions: HeaderButtonConfig[] | undefined,
  variant: PageShellRightAction,
): HeaderButtonConfig[] => {
  const targetIcon = variant === "home" ? HomeIcon : SettingIcon;
  const targetLabel = variant === "home" ? "ホーム" : "設定";

  if (!actions || actions.length === 0) {
    return [
      {
        Icon: targetIcon,
        label: targetLabel,
        accessibilityLabel: targetLabel,
      },
    ];
  }

  const nextActions = actions.slice(0, actions.length - 1).map((action) => ({ ...action }));
  const lastAction = actions[actions.length - 1];
  nextActions.push({
    ...lastAction,
    Icon: targetIcon,
    label: lastAction?.label ?? targetLabel,
    accessibilityLabel: lastAction?.accessibilityLabel ?? targetLabel,
  });

  return nextActions;
};

const buildHeaderConfig = (
  config: HeaderConfig | undefined,
  variant: PageShellRightAction,
): HeaderConfig => {
  const base = config ?? defaultHeaderConfig;

  return {
    ...base,
    menu: resolveButton(config?.menu, base.menu),
    logo: resolveLogo(config?.logo, base.logo) ?? undefined,
    actions: ensureRightAction(config?.actions ?? base.actions, variant),
  };
};

const PageShell = ({
  children,
  headerConfig,
  backgroundStyle,
  contentStyle,
  rightActionVariant = "settings",
  drawer,
  drawerWidth = 320,
  drawerTransitionDuration = 220,
}: PageShellProps) => {
  const resolvedHeaderConfig = React.useMemo(
    () => buildHeaderConfig(headerConfig, rightActionVariant),
    [headerConfig, rightActionVariant],
  );

  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const drawerAnim = React.useRef(new Animated.Value(0));

  const toggleDrawer = React.useCallback(() => {
    setIsDrawerOpen((prev) => !prev);
  }, []);

  React.useEffect(() => {
    if (!drawer && isDrawerOpen) {
      setIsDrawerOpen(false);
    }
  }, [drawer, isDrawerOpen]);

  React.useEffect(() => {
    Animated.timing(drawerAnim.current, {
      toValue: isDrawerOpen && drawer ? 1 : 0,
      duration: drawerTransitionDuration,
      useNativeDriver: true,
    }).start();
  }, [drawer, drawerTransitionDuration, isDrawerOpen]);

  const headerWithDrawer = React.useMemo(() => {
    if (!drawer || !resolvedHeaderConfig.menu) {
      return resolvedHeaderConfig;
    }

    const originalOnPress = resolvedHeaderConfig.menu.onPress;

    return {
      ...resolvedHeaderConfig,
      menu: {
        ...resolvedHeaderConfig.menu,
        onPress: (event: GestureResponderEvent) => {
          originalOnPress?.(event);
          toggleDrawer();
        },
      },
    };
  }, [drawer, resolvedHeaderConfig, toggleDrawer]);

  const drawerTranslateX = drawerAnim.current.interpolate({
    inputRange: [0, 1],
    outputRange: [-drawerWidth - StyleVariable.spaceLg, 0],
  });

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <Header config={headerWithDrawer} />
      <ImageBackground
        source={require("../assets/PageShellBg.png")}
        style={[styles.background, backgroundStyle]}
        imageStyle={styles.backgroundImage}
      >
        <View style={styles.contentWrapper}>
          <View style={[styles.content, contentStyle]}>{children}</View>
          {drawer ? (
            <Animated.View
              style={[
                styles.drawerContainer,
                {
                  width: drawerWidth,
                  transform: [{ translateX: drawerTranslateX }],
                },
              ]}
            >
              <View style={styles.drawerInner}>{drawer}</View>
            </Animated.View>
          ) : null}
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.colorWhite,
  },
  background: {
    flex: 1,
    padding: StyleVariable.spaceLg,
  },
  backgroundImage: {
    resizeMode: "cover",
  },
  contentWrapper: {
    flex: 1,
    position: "relative",
  },
  content: {
    flex: 1,
  },
  drawerContainer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    paddingVertical: StyleVariable.spaceLg,
    paddingRight: StyleVariable.spaceLg,
  },
  drawerInner: {
    flex: 1,
  },
});

export default React.memo(PageShell);

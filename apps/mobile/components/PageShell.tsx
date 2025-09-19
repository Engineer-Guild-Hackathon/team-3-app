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
import CreateIcon from "../assets/Create.svg";
import HomeIcon from "../assets/home.svg";
import SettingIcon from "../assets/Setting.svg";
import { Color, StyleVariable } from "../GlobalStyles";
import { defaultHeaderConfig } from "./headerConfigs";
import { HEADER_ACTION_IDS, HEADER_LABELS } from "./headerConstants";
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
  onCreateNewChat?: () => void;
  onNavigateHome?: () => void;
  onNavigateSettings?: () => void;
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

type RightActionHandlers = {
  onNavigateHome?: () => void;
  onNavigateSettings?: () => void;
};

const ensureRightAction = (
  actions: HeaderButtonConfig[] | undefined,
  variant: PageShellRightAction,
  handlers: RightActionHandlers,
): HeaderButtonConfig[] => {
  const isHome = variant === "home";
  const targetIcon = isHome ? HomeIcon : SettingIcon;
  const targetLabel = isHome ? HEADER_LABELS.home : HEADER_LABELS.settings;
  const targetActionId = isHome
    ? HEADER_ACTION_IDS.navigateHome
    : HEADER_ACTION_IDS.navigateSettings;
  const targetHandler = isHome ? handlers.onNavigateHome : handlers.onNavigateSettings;

  if (!actions || actions.length === 0) {
    return [
      {
        actionId: targetActionId,
        Icon: targetIcon,
        label: targetLabel,
        accessibilityLabel: targetLabel,
        onPress: targetHandler
          ? (_event: GestureResponderEvent) => {
              targetHandler();
            }
          : undefined,
      },
    ];
  }

  const nextActions = actions.map((action) => ({ ...action }));
  const targetIndex = nextActions.findIndex((action) => action.actionId === targetActionId);
  const updateIndex = targetIndex >= 0 ? targetIndex : nextActions.length - 1;
  const baseAction = nextActions[updateIndex] ?? {};
  const originalOnPress = baseAction.onPress;

  nextActions[updateIndex] = {
    ...baseAction,
    actionId: targetActionId,
    Icon: targetIcon,
    label: baseAction.label ?? targetLabel,
    accessibilityLabel: baseAction.accessibilityLabel ?? targetLabel,
    onPress: targetHandler
      ? (event: GestureResponderEvent) => {
          targetHandler();
          originalOnPress?.(event);
        }
      : originalOnPress,
  } as HeaderButtonConfig;

  return nextActions;
};

const CREATE_LABELS = [HEADER_LABELS.create, "新しい質問"];

const isCreateAction = (action: HeaderButtonConfig): boolean => {
  if (action.actionId === HEADER_ACTION_IDS.createThread) {
    return true;
  }
  const label = action.label ?? action.accessibilityLabel ?? "";
  return CREATE_LABELS.some((keyword) => label?.includes?.(keyword));
};

const mergeCreateHandler = (
  action: HeaderButtonConfig,
  handler: () => void,
): HeaderButtonConfig => {
  const originalOnPress = action.onPress;

  return {
    ...action,
    onPress: (event: GestureResponderEvent) => {
      handler();
      originalOnPress?.(event);
    },
  };
};

const attachCreateAction = (
  actions: HeaderButtonConfig[] | undefined,
  handler?: () => void,
): HeaderButtonConfig[] | undefined => {
  if (!actions) {
    return handler
      ? [
          {
            actionId: HEADER_ACTION_IDS.createThread,
            Icon: CreateIcon,
            label: HEADER_LABELS.create,
            accessibilityLabel: HEADER_LABELS.create,
            onPress: (_event: GestureResponderEvent) => {
              handler();
            },
          },
        ]
      : actions;
  }

  if (!handler) {
    return actions.map((action) => ({ ...action }));
  }

  const nextActions = actions.map((action) =>
    isCreateAction(action) ? mergeCreateHandler(action, handler) : { ...action },
  );

  if (!nextActions.some(isCreateAction)) {
    nextActions.unshift({
      actionId: HEADER_ACTION_IDS.createThread,
      Icon: CreateIcon,
      label: HEADER_LABELS.create,
      accessibilityLabel: HEADER_LABELS.create,
      onPress: (_event: GestureResponderEvent) => {
        handler();
      },
    });
  }

  return nextActions;
};

const buildHeaderConfig = (
  config: HeaderConfig | undefined,
  variant: PageShellRightAction,
  onCreateNewChat?: () => void,
  onNavigateHome?: () => void,
  onNavigateSettings?: () => void,
): HeaderConfig => {
  const base = config ?? defaultHeaderConfig;
  const baseActions = config?.actions ?? base.actions;
  const actionsWithRight = ensureRightAction(baseActions, variant, {
    onNavigateHome,
    onNavigateSettings,
  });
  const actionsWithCreate = attachCreateAction(actionsWithRight, onCreateNewChat);

  return {
    ...base,
    menu: resolveButton(config?.menu, base.menu),
    logo: resolveLogo(config?.logo, base.logo) ?? undefined,
    actions: actionsWithCreate,
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
  onCreateNewChat,
  onNavigateHome,
  onNavigateSettings,
}: PageShellProps) => {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const drawerAnim = React.useRef(new Animated.Value(0));

  const toggleDrawer = React.useCallback(() => {
    setIsDrawerOpen((prev) => !prev);
  }, []);

  const closeDrawer = React.useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const createHandler = React.useMemo(() => {
    if (!onCreateNewChat) {
      return undefined;
    }
    return () => {
      onCreateNewChat();
      closeDrawer();
    };
  }, [closeDrawer, onCreateNewChat]);

  const resolvedHeaderConfig = React.useMemo(
    () =>
      buildHeaderConfig(
        headerConfig,
        rightActionVariant,
        createHandler,
        onNavigateHome,
        onNavigateSettings,
      ),
    [createHandler, headerConfig, onNavigateHome, onNavigateSettings, rightActionVariant],
  );

  const enhancedDrawer = React.useMemo(() => {
    if (!drawer || !React.isValidElement(drawer)) {
      return drawer;
    }

    const props = drawer.props as {
      onCreatePress?: () => void;
      onSelect?: (entry: unknown) => void;
    };
    const originalOnCreate = props?.onCreatePress;
    const originalOnSelect = props?.onSelect;

    const nextProps: Record<string, unknown> = {};

    if (createHandler || originalOnCreate) {
      nextProps.onCreatePress = () => {
        if (createHandler) {
          createHandler();
        } else {
          originalOnCreate?.();
          closeDrawer();
          return;
        }

        if (originalOnCreate && originalOnCreate !== onCreateNewChat) {
          originalOnCreate();
        }
      };
    }

    if (originalOnSelect) {
      nextProps.onSelect = (entry: unknown) => {
        originalOnSelect(entry);
        closeDrawer();
      };
    }

    return React.cloneElement(drawer as React.ReactElement<any>, nextProps);
  }, [closeDrawer, createHandler, drawer, onCreateNewChat]);

  React.useEffect(() => {
    if (!enhancedDrawer && isDrawerOpen) {
      setIsDrawerOpen(false);
    }
  }, [enhancedDrawer, isDrawerOpen]);

  React.useEffect(() => {
    Animated.timing(drawerAnim.current, {
      toValue: isDrawerOpen && enhancedDrawer ? 1 : 0,
      duration: drawerTransitionDuration,
      useNativeDriver: true,
    }).start();
  }, [drawerTransitionDuration, enhancedDrawer, isDrawerOpen]);

  const headerWithDrawer = React.useMemo(() => {
    if (!enhancedDrawer || !resolvedHeaderConfig.menu) {
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
  }, [enhancedDrawer, resolvedHeaderConfig, toggleDrawer]);

  const drawerTranslateX = drawerAnim.current.interpolate({
    inputRange: [0, 1],
    outputRange: [-drawerWidth - StyleVariable.spaceLg, 0],
  });

  return (
    <ImageBackground
      source={require("../assets/PageShellBg.png")}
      style={styles.rootBackground}
      imageStyle={styles.backgroundImage}
    >
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={[styles.background, backgroundStyle]}>
          <View style={styles.inner}>
            <Header config={headerWithDrawer} />
            <View style={styles.contentWrapper}>
              <View style={[styles.content, contentStyle]}>{children}</View>
              {enhancedDrawer ? (
                <Animated.View
                  style={[
                    styles.drawerContainer,
                    {
                      width: drawerWidth,
                      transform: [{ translateX: drawerTranslateX }],
                    },
                  ]}
                >
                  <View style={styles.drawerInner}>{enhancedDrawer}</View>
                </Animated.View>
              ) : null}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  rootBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  background: {
    padding: StyleVariable.spaceLg,
    flex: 1,
  },
  backgroundImage: {
    resizeMode: "cover",
  },
  inner: {
    flex: 1,
    gap: StyleVariable.spaceMd,
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

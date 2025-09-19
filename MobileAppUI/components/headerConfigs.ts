import CreateIcon from "../assets/Create.svg";
import MenuIcon from "../assets/Hamburger-Menu.svg";
import HomeIcon from "../assets/Home.svg";
import SettingIcon from "../assets/Setting.svg";

import { HEADER_ACTION_IDS, HEADER_LABELS } from "./headerConstants";
import type { HeaderConfig } from "./headerTypes";

export const homeHeaderConfig: HeaderConfig = {
  menu: {
    actionId: HEADER_ACTION_IDS.menuHistory,
    label: HEADER_LABELS.history,
    accessibilityLabel: HEADER_LABELS.history,
    Icon: MenuIcon,
  },
  actions: [
    {
      actionId: HEADER_ACTION_IDS.createThread,
      label: HEADER_LABELS.create,
      accessibilityLabel: HEADER_LABELS.create,
      Icon: CreateIcon,
    },
    {
      actionId: HEADER_ACTION_IDS.navigateSettings,
      label: HEADER_LABELS.settings,
      accessibilityLabel: HEADER_LABELS.settings,
      Icon: SettingIcon,
    },
  ],
  logo: {
    source: require("../assets/SPARLogo.png"),
    contentFit: "contain",
  },
};

export const defaultHeaderConfig = homeHeaderConfig;

export const chatHeaderConfig: HeaderConfig = {
  menu: {
    actionId: HEADER_ACTION_IDS.menuHistory,
    label: HEADER_LABELS.history,
    accessibilityLabel: HEADER_LABELS.history,
    Icon: MenuIcon,
  },
  actions: [
    {
      actionId: HEADER_ACTION_IDS.navigateHome,
      label: HEADER_LABELS.home,
      accessibilityLabel: HEADER_LABELS.home,
      Icon: HomeIcon,
    },
  ],
  logo: {
    source: require("../assets/SPARLogo.png"),
    contentFit: "contain",
  },
};

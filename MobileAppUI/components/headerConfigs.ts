import CreateIcon from "../assets/Create.svg";
import MenuIcon from "../assets/Hamburger-Menu.svg";
import HomeIcon from "../assets/Home.svg";
import SettingIcon from "../assets/Setting.svg";

import type { HeaderConfig } from "./headerTypes";

export const homeHeaderConfig: HeaderConfig = {
  menu: {
    label: "履歴",
    accessibilityLabel: "履歴",
    Icon: MenuIcon,
  },
  actions: [
    {
      label: "新規",
      accessibilityLabel: "新規",
      Icon: CreateIcon,
    },
    {
      label: "設定",
      accessibilityLabel: "設定",
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
    label: "履歴",
    accessibilityLabel: "履歴",
    Icon: MenuIcon,
  },
  actions: [
    {
      label: "ホーム",
      accessibilityLabel: "ホーム",
      Icon: HomeIcon,
    },
  ],
  logo: {
    source: require("../assets/SPARLogo.png"),
    contentFit: "contain",
  },
};

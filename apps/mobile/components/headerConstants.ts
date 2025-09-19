export const HEADER_ACTION_IDS = {
  menuHistory: "menu-history",
  createThread: "create-thread",
  navigateHome: "navigate-home",
  navigateSettings: "navigate-settings",
} as const;

export type HeaderActionId = (typeof HEADER_ACTION_IDS)[keyof typeof HEADER_ACTION_IDS];

export const HEADER_LABELS = {
  history: "履歴",
  create: "新規",
  settings: "設定",
  home: "ホーム",
} as const;

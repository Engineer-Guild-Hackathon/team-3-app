import * as React from "react";

import type { ChatThread } from "../components/types";
import { SAMPLE_THREADS } from "../data/sampleThreads";

type ChatStoreValue = {
  threads: ChatThread[];
  setThreads: React.Dispatch<React.SetStateAction<ChatThread[]>>;
};

const ChatStoreContext = React.createContext<ChatStoreValue | null>(null);

export type ChatStoreProviderProps = {
  children: React.ReactNode;
};

export const ChatStoreProvider = ({ children }: ChatStoreProviderProps) => {
  const [threads, setThreads] = React.useState<ChatThread[]>(SAMPLE_THREADS);

  const value = React.useMemo(
    () => ({ threads, setThreads }),
    [threads],
  );

  return (
    <ChatStoreContext.Provider value={value}>{children}</ChatStoreContext.Provider>
  );
};

export const useChatStore = (): ChatStoreValue => {
  const context = React.useContext(ChatStoreContext);
  if (!context) {
    throw new Error("useChatStore は ChatStoreProvider 内で使用してください");
  }
  return context;
};

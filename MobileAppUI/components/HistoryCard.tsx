import * as React from "react";

import Card from "./Card";
import List1 from "./List1";
import type { ChatHistoryEntry } from "./types";

export type HistoryCardProps = {
  entries: ChatHistoryEntry[];
  activeId?: string;
  onSelect?: (entry: ChatHistoryEntry) => void;
};

const HistoryCard = ({ entries, activeId, onSelect }: HistoryCardProps) => {
  return (
    <Card title="履歴">
      <List1 entries={entries} activeId={activeId} onSelect={onSelect} />
    </Card>
  );
};

export default React.memo(HistoryCard);

import * as React from "react";

import Card from "./Card";
import HistoryList from "./HistoryList";
import type { ChatHistoryEntry } from "./types";

export type HistoryCardProps = {
  entries: ChatHistoryEntry[];
  activeId?: string;
  onSelect?: (entry: ChatHistoryEntry) => void;
  heightMode?: "auto" | "fixed" | "flex";
  height?: number;
};

const HistoryCard = ({
  entries,
  activeId,
  onSelect,
  heightMode,
  height,
}: HistoryCardProps) => {
  // Card コンポーネントに履歴リストを内包させる薄いラッパー
  return (
    <Card title="履歴" heightMode={heightMode} height={height}>
      <HistoryList entries={entries} activeId={activeId} onSelect={onSelect} />
    </Card>
  );
};

export default React.memo(HistoryCard);

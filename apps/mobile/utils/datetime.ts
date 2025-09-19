export type HistoryTimestampParts = {
  date: string;
  time: string;
};

const historyDateFormatter = new Intl.DateTimeFormat("ja-JP", {
  month: "2-digit",
  day: "2-digit",
});

const historyTimeFormatter = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const bubbleFormatter = new Intl.DateTimeFormat("ja-JP", {
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export const parseChatTimestamp = (value?: string): Date | null => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

export const formatHistoryTimestampParts = (
  value?: string,
  now: Date = new Date(),
): HistoryTimestampParts | null => {
  if (!value) {
    return null;
  }

  const parsed = parseChatTimestamp(value);
  if (!parsed) {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const [head, ...rest] = trimmed.split(" ");
    if (rest.length > 0) {
      return { date: head, time: rest.join(" ") };
    }
    if (/\d{1,2}:\d{2}/.test(trimmed)) {
      return { date: "今日", time: trimmed };
    }
    return { date: trimmed, time: "" };
  }

  const isSameDay =
    parsed.getFullYear() === now.getFullYear() &&
    parsed.getMonth() === now.getMonth() &&
    parsed.getDate() === now.getDate();

  const dateLabel = isSameDay ? "今日" : historyDateFormatter.format(parsed);
  const timeLabel = historyTimeFormatter.format(parsed);

  return { date: dateLabel, time: timeLabel };
};

export const formatBubbleTimestamp = (value?: string): string => {
  if (!value) {
    return "";
  }
  const parsed = parseChatTimestamp(value);
  if (!parsed) {
    return value;
  }
  return bubbleFormatter.format(parsed);
};

export const nowAsIsoString = (): string => new Date().toISOString();

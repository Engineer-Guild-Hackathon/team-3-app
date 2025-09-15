// チャットID関連のユーティリティ（日本語コメント）

/**
 * UUID 文字列から衝突確率が低い 32bit 正整数を生成する簡易ハッシュ。
 * - 既存Web実装（ChatApp）と同一ロジックを関数化
 * - モバイル（React Native）へもそのまま移植可能
 */
export function numericIdFromUuid(uuid: string): number {
  let h = 0;
  for (let i = 0; i < uuid.length; i++) {
    h = (h * 31 + uuid.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}


// UUID から 32bit 整数を生成する単純なハッシュ（Web 実装と揃える）
export function numericIdFromUuid(uuid: string): number {
  let hash = 0;
  for (let index = 0; index < uuid.length; index += 1) {
    hash = (hash * 31 + uuid.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

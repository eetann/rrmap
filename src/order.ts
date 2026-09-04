/**
 * 並び順はアイテム同士の関係なので、個々のファイルではなくディレクトリ直下の
 * 1ファイルにidの配列としてまとめて置く。タスクとマイルストーンで同じ形の
 * ファイルを使うので、その読み書きと並び替えの計算はここにまとめる。
 */
export const ORDER_FILE_NAME = "order.json";

export function parseOrder(raw: string): string[] {
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    return [];
  }
  // 手で書き換えられる前提のファイルなので、余計な値や重複は黙って落とす
  const ids: string[] = [];
  for (const value of parsed) {
    if (typeof value === "string" && value !== "" && !ids.includes(value)) {
      ids.push(value);
    }
  }
  return ids;
}

export function stringifyOrder(ids: string[]): string {
  return `${JSON.stringify(ids, null, 2)}\n`;
}

/**
 * 一部のアイテムだけを並び替えた結果を、全体の並びへ反映する。
 * 並び替えたidが元々占めていた位置へ新しい順で入れ直すので、
 * 間に挟まっている（一覧に出ていない）アイテムの位置は動かない。
 */
export function applyPartialOrder(fullIds: string[], reorderedIds: string[]): string[] {
  const subset = reorderedIds.filter((id) => fullIds.includes(id));
  const inSubset = new Set(subset);
  let next = 0;
  return fullIds.map((id) => (inSubset.has(id) ? (subset[next++] as string) : id));
}

/**
 * 縦並びのリストで、fromの位置の要素をtoの位置へ動かす。
 */
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return items;
  }
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved as T);
  return next;
}

import { isArchiveMilestoneId, type Milestone } from "./milestone";

/**
 * マイルストーンの並び順を保存するファイル名。
 * 並び順はマイルストーン同士の関係なので、個々のファイルではなく
 * .rrmap/milestones/ 直下の1ファイルにidの配列としてまとめて置く。
 */
export const MILESTONE_ORDER_FILE_NAME = "order.json";

export function parseMilestoneOrder(raw: string): string[] {
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

export function stringifyMilestoneOrder(ids: string[]): string {
  return `${JSON.stringify(ids, null, 2)}\n`;
}

/**
 * order.jsonに載っている順を先頭に、載っていないものをid順で後ろに並べる。
 * 新しく作ったマイルストーンは並び順の指定がないので末尾に来る。
 * 組み込みのアーカイブは並び替えの対象外で、常に末尾に置く。
 */
export function sortMilestonesByOrder(milestones: Milestone[], order: string[]): Milestone[] {
  const rank = new Map(order.map((id, index) => [id, index]));
  const ordered: Milestone[] = [];
  const rest: Milestone[] = [];
  const archives: Milestone[] = [];

  for (const milestone of milestones) {
    if (isArchiveMilestoneId(milestone.id)) {
      archives.push(milestone);
    } else if (rank.has(milestone.id)) {
      ordered.push(milestone);
    } else {
      rest.push(milestone);
    }
  }

  ordered.sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
  rest.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return [...ordered, ...rest, ...archives];
}

/**
 * 一部のマイルストーンだけを並び替えた結果を、全体の並びへ反映する。
 * 並び替えたidが元々占めていた位置へ新しい順で入れ直すので、
 * 間に挟まっている非表示マイルストーンの位置は動かない。
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

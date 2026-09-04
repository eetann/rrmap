import { isArchiveMilestoneId, type Milestone } from "./milestone";

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

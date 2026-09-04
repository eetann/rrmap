import { taskIdNumber, type Task } from "./task";

/**
 * order.jsonに載っている順を先頭に、載っていないものをid順で後ろに並べる。
 * 並び順はマイルストーンをまたいだ1本の配列で持ち、マイルストーンごとの一覧は
 * そこから該当タスクを抜き出したものとして扱う。タスクの所属を移し替えても
 * 並び順を作り直さずに済む。
 */
export function sortTasksByOrder(tasks: Task[], order: string[]): Task[] {
  const rank = new Map(order.map((id, index) => [id, index]));
  const ordered: Task[] = [];
  const rest: Task[] = [];

  for (const task of tasks) {
    if (rank.has(task.id)) {
      ordered.push(task);
    } else {
      rest.push(task);
    }
  }

  ordered.sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
  rest.sort((a, b) => taskIdNumber(a.id) - taskIdNumber(b.id));
  return [...ordered, ...rest];
}

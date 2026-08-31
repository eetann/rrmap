import type { Task } from "../../task";

export interface TaskTreeNode {
  task: Task;
  children: Task[];
}

/**
 * 一覧に並べるために、子タスクを親タスクの直下へぶら下げた構造を作る。
 * 親が一覧にいない子（検索で親だけ絞り込みから外れた場合など）はトップレベル扱いにするので、
 * どのタスクもどこかには必ず現れる。並び順は渡された配列の順を保つ。
 */
export function buildTaskTree(tasks: Task[]): TaskTreeNode[] {
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const isChild = (task: Task) => {
    if (task.parent === null || task.parent === task.id) {
      return false;
    }
    const parent = taskById.get(task.parent);
    // 親子関係は1階層のみなので、親自身が子タスクのときはぶら下げない
    return parent !== undefined && parent.parent === null;
  };

  const nodes = tasks
    .filter((task) => !isChild(task))
    .map((task) => ({ task, children: [] as Task[] }));
  const nodeById = new Map(nodes.map((node) => [node.task.id, node]));

  for (const task of tasks) {
    if (isChild(task) && task.parent !== null) {
      nodeById.get(task.parent)?.children.push(task);
    }
  }

  return nodes;
}

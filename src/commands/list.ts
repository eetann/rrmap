import { define } from "gunshi";
import { listTasks, resolveTasksDir } from "../store";
import { TASK_STATUSES } from "../task";

export const listCommand = define({
  name: "list",
  description: "タスク一覧を表示する",
  args: {
    status: {
      type: "enum",
      choices: TASK_STATUSES,
      description: "ステータスで絞り込む",
    },
    parent: {
      type: "number",
      description: "親タスクidで絞り込む",
    },
  },
  run: async (ctx) => {
    const tasksDir = resolveTasksDir();
    let tasks = await listTasks(tasksDir);

    if (ctx.values.status !== undefined) {
      tasks = tasks.filter((task) => task.status === ctx.values.status);
    }
    if (ctx.values.parent !== undefined) {
      tasks = tasks.filter((task) => task.parent === ctx.values.parent);
    }

    if (tasks.length === 0) {
      console.log("no tasks");
      return;
    }

    for (const task of tasks) {
      const parentLabel = task.parent === null ? "-" : `#${task.parent}`;
      console.log(`#${task.id}\t[${task.status}]\tparent:${parentLabel}\t${task.title}`);
    }
  },
});

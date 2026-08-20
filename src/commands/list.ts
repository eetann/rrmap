import { define } from "gunshi";
import { listTasks, resolveTasksDir } from "../store";
import { TASK_STATUSES } from "../task";
import { parseMilestoneId } from "./milestone-id";
import { parseTaskId } from "./task-id";

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
      type: "string",
      description: "親タスクidで絞り込む",
    },
    milestone: {
      type: "string",
      description: "マイルストーンidで絞り込む",
    },
  },
  run: async (ctx) => {
    const tasksDir = resolveTasksDir();
    let tasks = await listTasks(tasksDir);

    if (ctx.values.status !== undefined) {
      tasks = tasks.filter((task) => task.status === ctx.values.status);
    }
    if (ctx.values.parent !== undefined) {
      const parent = parseTaskId(ctx.values.parent);
      tasks = tasks.filter((task) => task.parent === parent);
    }
    if (ctx.values.milestone !== undefined) {
      const milestone = parseMilestoneId(ctx.values.milestone);
      tasks = tasks.filter((task) => task.milestone === milestone);
    }

    if (tasks.length === 0) {
      console.log("no tasks");
      return;
    }

    for (const task of tasks) {
      const parentLabel = task.parent === null ? "-" : `#${task.parent}`;
      const milestoneLabel = task.milestone === null ? "-" : task.milestone;
      console.log(
        `#${task.id}\t[${task.status}]\tparent:${parentLabel}\tmilestone:${milestoneLabel}\t${task.title}`,
      );
    }
  },
});

import { define } from "gunshi";
import { readTask, resolveTasksDir, writeTask } from "../store.ts";
import { TASK_STATUSES } from "../task.ts";
import { parseTaskId } from "./task-id.ts";

export const editCommand = define({
  name: "edit",
  description: "タスクを編集する",
  args: {
    id: {
      type: "positional",
      description: "タスクid",
    },
    status: {
      type: "enum",
      choices: TASK_STATUSES,
      description: "ステータスを変更する",
    },
    title: {
      type: "string",
      description: "タイトルを変更する",
    },
  },
  run: async (ctx) => {
    const id = parseTaskId(ctx.values.id);
    const tasksDir = resolveTasksDir();
    const task = await readTask(tasksDir, id);

    if (ctx.values.status !== undefined) {
      task.status = ctx.values.status;
    }
    if (ctx.values.title !== undefined) {
      task.title = ctx.values.title;
    }

    await writeTask(tasksDir, task);
    console.log(`updated task #${id}`);
  },
});

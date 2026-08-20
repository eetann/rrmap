import { define } from "gunshi";
import { readTask, resolveTasksDir, writeTask } from "../store";
import { TASK_STATUSES } from "../task";
import { parseTaskId } from "./task-id";

export const editCommand = define({
  name: "edit",
  description: "タスクを編集する",
  examples: `$ rrmap edit TASK-0001 --status in_progress
$ rrmap edit TASK-0001 --title "新しいタイトル"

このコマンドで変更できるのは status / title のみ。本文（方針・意思決定など）を書きたい場合は
.rrmap/tasks/TASK-XXXX.md を直接編集してよい（フォーマットは \`rrmap format\` 参照）。`,
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

import { define } from "gunshi";
import { ARCHIVE_MILESTONE_ID } from "../milestone";
import { readMilestone, resolveMilestonesDir } from "../milestone-store";
import { readTask, resolveTasksDir, writeTask } from "../store";
import { TASK_STATUSES } from "../task";
import { parseMilestoneId } from "./milestone-id";
import { parseTaskId } from "./task-id";

// --milestone に渡して未分類（milestone: null）に戻すための値
const NO_MILESTONE = "none";

export const editCommand = define({
  name: "edit",
  description: "タスクを編集する",
  examples: `$ rrmap edit TASK-0001 --status in_progress
$ rrmap edit TASK-0001 --title "新しいタイトル"
$ rrmap edit TASK-0001 TASK-0007 TASK-0012 --milestone ${ARCHIVE_MILESTONE_ID}
$ rrmap edit TASK-0001 --milestone ${NO_MILESTONE}

idは複数まとめて指定でき、同じ変更が全idに適用される。
このコマンドで変更できるのは status / title / milestone のみ。本文（方針・意思決定など）を書きたい場合は
.rrmap/tasks/TASK-XXXX.md を直接編集してよい（フォーマットは \`rrmap format\` 参照）。`,
  args: {
    ids: {
      type: "positional",
      multiple: true,
      description: "タスクid（スペース区切りで複数指定できる）",
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
    milestone: {
      type: "string",
      description: `所属マイルストーンを変更する（${NO_MILESTONE}で未分類に戻す。${ARCHIVE_MILESTONE_ID}でアーカイブ）`,
    },
  },
  run: async (ctx) => {
    const rawIds = ctx.values.ids ?? [];
    if (rawIds.length === 0) {
      throw new Error("task id is required");
    }
    const ids = rawIds.map(parseTaskId);

    // undefined（変更しない）と null（未分類にする）を区別する
    let milestone: string | null | undefined;
    if (ctx.values.milestone !== undefined) {
      if (ctx.values.milestone === NO_MILESTONE) {
        milestone = null;
      } else {
        milestone = parseMilestoneId(ctx.values.milestone);
        await readMilestone(resolveMilestonesDir(), milestone);
      }
    }

    // 存在しないidが混ざっていたときに一部だけ書き換わらないよう、全部読んでから書く
    const tasksDir = resolveTasksDir();
    const tasks = await Promise.all(ids.map((id) => readTask(tasksDir, id)));

    for (const task of tasks) {
      if (ctx.values.status !== undefined) {
        task.status = ctx.values.status;
      }
      if (ctx.values.title !== undefined) {
        task.title = ctx.values.title;
      }
      if (milestone !== undefined) {
        task.milestone = milestone;
      }
      await writeTask(tasksDir, task);
      console.log(`updated task #${task.id}`);
    }
  },
});

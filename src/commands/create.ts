import { define } from "gunshi";
import { readMilestone, resolveMilestonesDir } from "../milestone-store";
import { listTasks, resolveTasksDir, writeTask } from "../store";
import { taskIdFromNumber, taskIdNumber } from "../task";
import { parseMilestoneId } from "./milestone-id";
import { parseTaskId } from "./task-id";

export const createCommand = define({
  name: "create",
  description: "タスクを作成する",
  examples: `$ rrmap create "タスクのタイトル"
$ rrmap create "タスクのタイトル" --milestone MILESTONE-0001

.rrmap/tasks/TASK-XXXX.md を直接作成してもよい（フォーマットは \`rrmap format\` 参照）。`,
  args: {
    title: {
      type: "positional",
      description: "タスクのタイトル",
    },
    parent: {
      type: "string",
      description: "分割元の親タスクid",
    },
    milestone: {
      type: "string",
      description: "所属するマイルストーンid",
    },
  },
  run: async (ctx) => {
    const { title, parent, milestone } = ctx.values;
    const tasksDir = resolveTasksDir();
    const tasks = await listTasks(tasksDir);

    let parentId: string | null = null;
    if (parent !== undefined) {
      parentId = parseTaskId(parent);
      const parentTask = tasks.find((task) => task.id === parentId);
      if (!parentTask) {
        throw new Error(`parent task not found: #${parentId}`);
      }
      if (parentTask.parent !== null) {
        throw new Error(
          `parent task #${parentId} is itself a child task; nesting beyond one level is not allowed`,
        );
      }
    }

    let milestoneId: string | null = null;
    if (milestone !== undefined) {
      milestoneId = parseMilestoneId(milestone);
      await readMilestone(resolveMilestonesDir(), milestoneId);
    }

    const nextNumber = tasks.reduce((max, task) => Math.max(max, taskIdNumber(task.id)), 0) + 1;
    const id = taskIdFromNumber(nextNumber);
    await writeTask(tasksDir, {
      id,
      title,
      status: "draft",
      parent: parentId,
      milestone: milestoneId,
      body: "",
    });
    console.log(`created task #${id}: ${title}`);
  },
});

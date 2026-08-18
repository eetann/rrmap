import { define } from "gunshi";
import { readMilestone, resolveMilestonesDir } from "../milestone-store";
import { listTasks, resolveTasksDir, writeTask } from "../store";
import { parseMilestoneId } from "./milestone-id";

export const createCommand = define({
  name: "create",
  description: "タスクを作成する",
  args: {
    title: {
      type: "positional",
      description: "タスクのタイトル",
    },
    parent: {
      type: "number",
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

    if (parent !== undefined) {
      const parentTask = tasks.find((task) => task.id === parent);
      if (!parentTask) {
        throw new Error(`parent task not found: #${parent}`);
      }
      if (parentTask.parent !== null) {
        throw new Error(
          `parent task #${parent} is itself a child task; nesting beyond one level is not allowed`,
        );
      }
    }

    let milestoneId: string | null = null;
    if (milestone !== undefined) {
      milestoneId = parseMilestoneId(milestone);
      await readMilestone(resolveMilestonesDir(), milestoneId);
    }

    const id = tasks.reduce((max, task) => Math.max(max, task.id), 0) + 1;
    await writeTask(tasksDir, {
      id,
      title,
      status: "draft",
      parent: parent ?? null,
      milestone: milestoneId,
      body: "",
    });
    console.log(`created task #${id}: ${title}`);
  },
});

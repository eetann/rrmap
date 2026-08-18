import { define } from "gunshi";
import { listTasks, resolveTasksDir, writeTask } from "../store";

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
  },
  run: async (ctx) => {
    const { title, parent } = ctx.values;
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

    const id = tasks.reduce((max, task) => Math.max(max, task.id), 0) + 1;
    await writeTask(tasksDir, {
      id,
      title,
      status: "draft",
      parent: parent ?? null,
      body: "",
    });
    console.log(`created task #${id}: ${title}`);
  },
});

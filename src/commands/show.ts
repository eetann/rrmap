import { define } from "gunshi";
import { readTask, resolveTasksDir } from "../store";
import { parseTaskId } from "./task-id";

export const showCommand = define({
  name: "show",
  description: "タスクの詳細を表示する",
  args: {
    id: {
      type: "positional",
      description: "タスクid",
    },
  },
  run: async (ctx) => {
    const id = parseTaskId(ctx.values.id);
    const task = await readTask(resolveTasksDir(), id);

    console.log(`# ${task.title}`);
    console.log(`id: ${task.id}`);
    console.log(`status: ${task.status}`);
    console.log(`parent: ${task.parent === null ? "-" : `#${task.parent}`}`);
    console.log("");
    console.log(task.body);
  },
});

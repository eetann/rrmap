import { listMilestones, resolveMilestonesDir } from "../milestone-store";
import { listTasks, resolveTasksDir } from "../store";
import index from "./index.html";

const server = Bun.serve({
  routes: {
    "/": index,
    "/api/tasks": {
      async GET() {
        const tasks = await listTasks(resolveTasksDir());
        return Response.json(tasks);
      },
    },
    "/api/milestones": {
      async GET() {
        const milestones = await listMilestones(resolveMilestonesDir());
        return Response.json(milestones);
      },
    },
  },
  development: true,
});

console.log(`rrmap web UI: ${server.url}`);

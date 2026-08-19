import { isMilestoneId, isMilestoneStatus } from "../milestone";
import { listMilestones, readMilestone, resolveMilestonesDir, writeMilestone } from "../milestone-store";
import { listTasks, readTask, resolveTasksDir, writeTask } from "../store";
import { isTaskStatus } from "../task";
import index from "./index.html";

const server = Bun.serve({
  routes: {
    "/": index,
    "/api/tasks": {
      async GET() {
        const tasks = await listTasks(resolveTasksDir());
        return Response.json(tasks);
      },
      async POST(req) {
        const body = await req.json();
        const title = typeof body.title === "string" ? body.title.trim() : "";
        if (title === "") {
          return Response.json({ error: "title is required" }, { status: 400 });
        }

        let milestoneId: string | null = null;
        if (body.milestone !== null && body.milestone !== undefined) {
          if (!isMilestoneId(body.milestone)) {
            return Response.json({ error: "invalid milestone id" }, { status: 400 });
          }
          try {
            await readMilestone(resolveMilestonesDir(), body.milestone);
          } catch {
            return Response.json({ error: "milestone not found" }, { status: 400 });
          }
          milestoneId = body.milestone;
        }

        const tasksDir = resolveTasksDir();
        const tasks = await listTasks(tasksDir);
        const id = tasks.reduce((max, task) => Math.max(max, task.id), 0) + 1;
        const task = {
          id,
          title,
          status: "draft" as const,
          parent: null,
          milestone: milestoneId,
          body: "",
        };
        await writeTask(tasksDir, task);
        return Response.json(task, { status: 201 });
      },
    },
    "/api/tasks/:id": {
      async PATCH(req) {
        const id = Number(req.params.id);
        if (!Number.isInteger(id)) {
          return Response.json({ error: "invalid task id" }, { status: 400 });
        }

        const tasksDir = resolveTasksDir();
        let task: Awaited<ReturnType<typeof readTask>>;
        try {
          task = await readTask(tasksDir, id);
        } catch {
          return Response.json({ error: "task not found" }, { status: 404 });
        }

        const body = await req.json();
        if (body.title !== undefined) {
          if (typeof body.title !== "string" || body.title.trim() === "") {
            return Response.json({ error: "title must be a non-empty string" }, { status: 400 });
          }
          task.title = body.title;
        }
        if (body.status !== undefined) {
          if (!isTaskStatus(body.status)) {
            return Response.json({ error: "invalid status" }, { status: 400 });
          }
          task.status = body.status;
        }
        if (body.body !== undefined) {
          if (typeof body.body !== "string") {
            return Response.json({ error: "body must be a string" }, { status: 400 });
          }
          task.body = body.body;
        }
        if (body.milestone !== undefined) {
          if (body.milestone !== null) {
            if (!isMilestoneId(body.milestone)) {
              return Response.json({ error: "invalid milestone id" }, { status: 400 });
            }
            try {
              await readMilestone(resolveMilestonesDir(), body.milestone);
            } catch {
              return Response.json({ error: "milestone not found" }, { status: 400 });
            }
          }
          task.milestone = body.milestone;
        }

        await writeTask(tasksDir, task);
        return Response.json(task);
      },
    },
    "/api/milestones": {
      async GET() {
        const milestones = await listMilestones(resolveMilestonesDir());
        return Response.json(milestones);
      },
    },
    "/api/milestones/:id": {
      async PATCH(req) {
        const id = req.params.id;
        if (!isMilestoneId(id)) {
          return Response.json({ error: "invalid milestone id" }, { status: 400 });
        }

        const milestonesDir = resolveMilestonesDir();
        let milestone: Awaited<ReturnType<typeof readMilestone>>;
        try {
          milestone = await readMilestone(milestonesDir, id);
        } catch {
          return Response.json({ error: "milestone not found" }, { status: 404 });
        }

        const body = await req.json();
        if (body.title !== undefined) {
          if (typeof body.title !== "string" || body.title.trim() === "") {
            return Response.json({ error: "title must be a non-empty string" }, { status: 400 });
          }
          milestone.title = body.title;
        }
        if (body.status !== undefined) {
          if (!isMilestoneStatus(body.status)) {
            return Response.json({ error: "invalid status" }, { status: 400 });
          }
          milestone.status = body.status;
        }
        if (body.body !== undefined) {
          if (typeof body.body !== "string") {
            return Response.json({ error: "body must be a string" }, { status: 400 });
          }
          milestone.body = body.body;
        }

        await writeMilestone(milestonesDir, milestone);
        return Response.json(milestone);
      },
    },
  },
  development: true,
});

console.log(`rrmap web UI: ${server.url}`);

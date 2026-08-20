import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { isMilestoneId, isMilestoneStatus } from "../milestone";
import {
  listMilestones,
  readMilestone,
  resolveMilestonesDir,
  writeMilestone,
} from "../milestone-store";
import { listTasks, readTask, resolveTasksDir, writeTask } from "../store";
import { isTaskId, isTaskStatus, taskIdFromNumber, taskIdNumber } from "../task";
import { createFileWatcher } from "./watch";

const watcher = createFileWatcher([resolveTasksDir(), resolveMilestonesDir()]);

export const apiApp = new Hono();

apiApp.get("/api/tasks", async (c) => {
  const tasks = await listTasks(resolveTasksDir());
  return c.json(tasks);
});

apiApp.post("/api/tasks", async (c) => {
  const body = await c.req.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (title === "") {
    return c.json({ error: "title is required" }, 400);
  }

  let milestoneId: string | null = null;
  if (body.milestone !== null && body.milestone !== undefined) {
    if (!isMilestoneId(body.milestone)) {
      return c.json({ error: "invalid milestone id" }, 400);
    }
    try {
      await readMilestone(resolveMilestonesDir(), body.milestone);
    } catch {
      return c.json({ error: "milestone not found" }, 400);
    }
    milestoneId = body.milestone;
  }

  const tasksDir = resolveTasksDir();
  const tasks = await listTasks(tasksDir);
  const nextNumber = tasks.reduce((max, task) => Math.max(max, taskIdNumber(task.id)), 0) + 1;
  const id = taskIdFromNumber(nextNumber);
  const task = {
    id,
    title,
    status: "draft" as const,
    parent: null,
    milestone: milestoneId,
    body: "",
  };
  await writeTask(tasksDir, task);
  return c.json(task, 201);
});

apiApp.patch("/api/tasks/:id", async (c) => {
  const id = c.req.param("id");
  if (!isTaskId(id)) {
    return c.json({ error: "invalid task id" }, 400);
  }

  const tasksDir = resolveTasksDir();
  let task: Awaited<ReturnType<typeof readTask>>;
  try {
    task = await readTask(tasksDir, id);
  } catch {
    return c.json({ error: "task not found" }, 404);
  }

  const body = await c.req.json();
  if (body.title !== undefined) {
    if (typeof body.title !== "string" || body.title.trim() === "") {
      return c.json({ error: "title must be a non-empty string" }, 400);
    }
    task.title = body.title;
  }
  if (body.status !== undefined) {
    if (!isTaskStatus(body.status)) {
      return c.json({ error: "invalid status" }, 400);
    }
    task.status = body.status;
  }
  if (body.body !== undefined) {
    if (typeof body.body !== "string") {
      return c.json({ error: "body must be a string" }, 400);
    }
    task.body = body.body;
  }
  if (body.milestone !== undefined) {
    if (body.milestone !== null) {
      if (!isMilestoneId(body.milestone)) {
        return c.json({ error: "invalid milestone id" }, 400);
      }
      try {
        await readMilestone(resolveMilestonesDir(), body.milestone);
      } catch {
        return c.json({ error: "milestone not found" }, 400);
      }
    }
    task.milestone = body.milestone;
  }

  await writeTask(tasksDir, task);
  return c.json(task);
});

apiApp.get("/api/milestones", async (c) => {
  const milestones = await listMilestones(resolveMilestonesDir());
  return c.json(milestones);
});

apiApp.patch("/api/milestones/:id", async (c) => {
  const id = c.req.param("id");
  if (!isMilestoneId(id)) {
    return c.json({ error: "invalid milestone id" }, 400);
  }

  const milestonesDir = resolveMilestonesDir();
  let milestone: Awaited<ReturnType<typeof readMilestone>>;
  try {
    milestone = await readMilestone(milestonesDir, id);
  } catch {
    return c.json({ error: "milestone not found" }, 404);
  }

  const body = await c.req.json();
  if (body.title !== undefined) {
    if (typeof body.title !== "string" || body.title.trim() === "") {
      return c.json({ error: "title must be a non-empty string" }, 400);
    }
    milestone.title = body.title;
  }
  if (body.status !== undefined) {
    if (!isMilestoneStatus(body.status)) {
      return c.json({ error: "invalid status" }, 400);
    }
    milestone.status = body.status;
  }
  if (body.body !== undefined) {
    if (typeof body.body !== "string") {
      return c.json({ error: "body must be a string" }, 400);
    }
    milestone.body = body.body;
  }
  if (body.hidden !== undefined) {
    if (typeof body.hidden !== "boolean") {
      return c.json({ error: "hidden must be a boolean" }, 400);
    }
    milestone.hidden = body.hidden;
  }

  await writeMilestone(milestonesDir, milestone);
  return c.json(milestone);
});

apiApp.get("/api/events", (c) => {
  return streamSSE(c, async (stream) => {
    // 接続確立を即座にクライアントへ伝える。最初の書き込みを待たせると
    // (例えば直後にsleepしてしまうと) 一部ランタイムでレスポンスがflushされず、
    // 接続自体が確立していないように見える
    await stream.writeSSE({ event: "connected", data: "connected" });

    const unsubscribe = watcher.onChange(() => {
      void stream.writeSSE({ event: "changed", data: "changed" });
    });
    stream.onAbort(unsubscribe);
    while (!stream.closed && !stream.aborted) {
      await stream.sleep(30000);
      if (stream.closed || stream.aborted) {
        break;
      }
      await stream.writeSSE({ event: "ping", data: "ping" });
    }
  });
});

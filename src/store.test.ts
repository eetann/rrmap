import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { listTasks, readTask, resolveTasksDir, writeTask } from "./store";

describe("store", () => {
  let dir: string;
  let tasksDir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "rrmap-store-test-"));
    tasksDir = join(dir, ".rrmap", "tasks");
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  test("resolveTasksDir joins baseDir with .rrmap/tasks", () => {
    expect(resolveTasksDir("/foo/bar")).toBe(join("/foo/bar", ".rrmap", "tasks"));
  });

  test("listTasks returns [] when the directory doesn't exist", async () => {
    expect(await listTasks(tasksDir)).toEqual([]);
  });

  test("writeTask then readTask round-trips", async () => {
    await writeTask(tasksDir, {
      id: 1,
      title: "テスト",
      status: "draft",
      parent: null,
      body: "本文",
    });
    expect(await readTask(tasksDir, 1)).toEqual({
      id: 1,
      title: "テスト",
      status: "draft",
      parent: null,
      body: "本文",
    });
  });

  test("readTask throws for a missing id", async () => {
    await expect(readTask(tasksDir, 999)).rejects.toThrow("task not found: 999");
  });

  test("listTasks sorts by id", async () => {
    await writeTask(tasksDir, { id: 2, title: "b", status: "draft", parent: null, body: "" });
    await writeTask(tasksDir, { id: 1, title: "a", status: "draft", parent: null, body: "" });
    const tasks = await listTasks(tasksDir);
    expect(tasks.map((task) => task.id)).toEqual([1, 2]);
  });
});

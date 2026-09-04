import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  deleteTask,
  listTasks,
  readTask,
  reorderTasks,
  resolveTaskOrderPath,
  resolveTasksDir,
  writeTask,
  writeTaskOrder,
} from "./store";

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

  async function seed(ids: string[]): Promise<void> {
    for (const id of ids) {
      await writeTask(tasksDir, {
        id,
        title: id,
        status: "draft",
        parent: null,
        milestone: null,
        body: "",
      });
    }
  }

  test("resolveTasksDir joins baseDir with .rrmap/tasks", () => {
    expect(resolveTasksDir("/foo/bar")).toBe(join("/foo/bar", ".rrmap", "tasks"));
  });

  test("listTasks returns [] when the directory doesn't exist", async () => {
    expect(await listTasks(tasksDir)).toEqual([]);
  });

  test("writeTask then readTask round-trips", async () => {
    await writeTask(tasksDir, {
      id: "TASK-0001",
      title: "テスト",
      status: "draft",
      parent: null,
      milestone: null,
      body: "本文",
    });
    expect(await readTask(tasksDir, "TASK-0001")).toEqual({
      id: "TASK-0001",
      title: "テスト",
      status: "draft",
      parent: null,
      milestone: null,
      body: "本文",
    });
  });

  test("readTask throws for a missing id", async () => {
    await expect(readTask(tasksDir, "TASK-0999")).rejects.toThrow("task not found: TASK-0999");
  });

  test("listTasks sorts by id", async () => {
    await writeTask(tasksDir, {
      id: "TASK-0002",
      title: "b",
      status: "draft",
      parent: null,
      milestone: null,
      body: "",
    });
    await writeTask(tasksDir, {
      id: "TASK-0001",
      title: "a",
      status: "draft",
      parent: null,
      milestone: null,
      body: "",
    });
    const tasks = await listTasks(tasksDir);
    expect(tasks.map((task) => task.id)).toEqual(["TASK-0001", "TASK-0002"]);
  });

  test("listTasks follows order.json", async () => {
    await seed(["TASK-0001", "TASK-0002", "TASK-0003"]);
    await writeTaskOrder(tasksDir, ["TASK-0003", "TASK-0001"]);

    const tasks = await listTasks(tasksDir);
    expect(tasks.map((task) => task.id)).toEqual([
      "TASK-0003",
      "TASK-0001",
      // order.jsonに載っていないものはid順で後ろ
      "TASK-0002",
    ]);
  });

  test("listTasks falls back to id order when order.json is broken", async () => {
    await seed(["TASK-0002", "TASK-0001"]);
    await writeFile(resolveTaskOrderPath(tasksDir), "{ broken", "utf8");

    const tasks = await listTasks(tasksDir);
    expect(tasks.map((task) => task.id)).toEqual(["TASK-0001", "TASK-0002"]);
  });

  test("reorderTasks saves the new order and returns the sorted tasks", async () => {
    await seed(["TASK-0001", "TASK-0002", "TASK-0003"]);

    const tasks = await reorderTasks(tasksDir, ["TASK-0003", "TASK-0002", "TASK-0001"]);
    expect(tasks.map((task) => task.id)).toEqual(["TASK-0003", "TASK-0002", "TASK-0001"]);
    expect((await listTasks(tasksDir)).map((task) => task.id)).toEqual([
      "TASK-0003",
      "TASK-0002",
      "TASK-0001",
    ]);
  });

  test("reorderTasks keeps tasks outside the given subset in place", async () => {
    await seed(["TASK-0001", "TASK-0002", "TASK-0003"]);

    // 一覧に出ていないTASK-0002は2番目のまま
    const tasks = await reorderTasks(tasksDir, ["TASK-0003", "TASK-0001"]);
    expect(tasks.map((task) => task.id)).toEqual(["TASK-0003", "TASK-0002", "TASK-0001"]);
  });

  test("reorderTasks drops deleted tasks from order.json", async () => {
    await seed(["TASK-0001", "TASK-0002"]);
    await writeTaskOrder(tasksDir, ["TASK-0002", "TASK-0001", "TASK-0009"]);

    await reorderTasks(tasksDir, ["TASK-0001", "TASK-0002"]);
    expect(JSON.parse(await Bun.file(resolveTaskOrderPath(tasksDir)).text())).toEqual([
      "TASK-0001",
      "TASK-0002",
    ]);
  });

  test("deleteTask removes the task file", async () => {
    await writeTask(tasksDir, {
      id: "TASK-0001",
      title: "テスト",
      status: "draft",
      parent: null,
      milestone: null,
      body: "",
    });
    await deleteTask(tasksDir, "TASK-0001");
    expect(await listTasks(tasksDir)).toEqual([]);
  });

  test("deleteTask throws for a missing id", async () => {
    await expect(deleteTask(tasksDir, "TASK-0999")).rejects.toThrow("task not found: TASK-0999");
  });
});

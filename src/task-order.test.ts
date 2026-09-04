import { describe, expect, test } from "bun:test";
import type { Task } from "./task";
import { sortTasksByOrder } from "./task-order";

function task(id: string): Task {
  return { id, title: id, status: "draft", parent: null, milestone: null, body: "" };
}

describe("sortTasksByOrder", () => {
  test("follows the given order", () => {
    const tasks = [task("TASK-0001"), task("TASK-0002")];
    expect(sortTasksByOrder(tasks, ["TASK-0002", "TASK-0001"]).map((t) => t.id)).toEqual([
      "TASK-0002",
      "TASK-0001",
    ]);
  });

  test("puts tasks missing from the order last, sorted by id", () => {
    const tasks = [task("TASK-0001"), task("TASK-0002"), task("TASK-0010")];
    expect(sortTasksByOrder(tasks, ["TASK-0010"]).map((t) => t.id)).toEqual([
      "TASK-0010",
      "TASK-0001",
      "TASK-0002",
    ]);
  });

  test("ignores ids in the order that have no task", () => {
    const tasks = [task("TASK-0002"), task("TASK-0001")];
    expect(sortTasksByOrder(tasks, ["TASK-0009", "TASK-0002"]).map((t) => t.id)).toEqual([
      "TASK-0002",
      "TASK-0001",
    ]);
  });

  test("falls back to id order when the order is empty", () => {
    const tasks = [task("TASK-0010"), task("TASK-0002")];
    expect(sortTasksByOrder(tasks, []).map((t) => t.id)).toEqual(["TASK-0002", "TASK-0010"]);
  });
});

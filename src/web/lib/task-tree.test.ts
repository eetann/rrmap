import { describe, expect, test } from "bun:test";
import type { Task } from "../../task";
import { buildTaskTree } from "./task-tree";

function task(id: string, parent: string | null = null): Task {
  return { id, title: id, status: "draft", parent, milestone: null, body: "" };
}

describe("buildTaskTree", () => {
  test("子タスクを親の直下へぶら下げる", () => {
    const parent = task("TASK-0001");
    const child = task("TASK-0002", "TASK-0001");
    const other = task("TASK-0003");

    expect(buildTaskTree([parent, child, other])).toEqual([
      { task: parent, children: [child] },
      { task: other, children: [] },
    ]);
  });

  test("親が一覧にいない子はトップレベルとして並べる", () => {
    const orphan = task("TASK-0002", "TASK-0001");

    expect(buildTaskTree([orphan])).toEqual([{ task: orphan, children: [] }]);
  });

  test("渡された順序を保つ", () => {
    const child = task("TASK-0003", "TASK-0001");
    const parent = task("TASK-0001");
    const other = task("TASK-0002");

    expect(buildTaskTree([child, other, parent]).map((node) => node.task.id)).toEqual([
      "TASK-0002",
      "TASK-0001",
    ]);
  });

  test("孫にあたるタスクはぶら下げずトップレベルにする", () => {
    const parent = task("TASK-0001");
    const child = task("TASK-0002", "TASK-0001");
    const grandchild = task("TASK-0003", "TASK-0002");

    expect(buildTaskTree([parent, child, grandchild])).toEqual([
      { task: parent, children: [child] },
      { task: grandchild, children: [] },
    ]);
  });

  test("自分自身を親に持つタスクも消さない", () => {
    const selfParent = task("TASK-0001", "TASK-0001");

    expect(buildTaskTree([selfParent])).toEqual([{ task: selfParent, children: [] }]);
  });
});

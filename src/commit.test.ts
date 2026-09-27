import { describe, expect, test } from "bun:test";
import { buildCommitMessage, hasChanges, parseGitStatus } from "./commit";

/** git status --porcelain -z の出力を組み立てる */
function porcelain(...entries: string[]): string {
  return entries.map((entry) => `${entry}\0`).join("");
}

describe("parseGitStatus", () => {
  test("classifies tasks and milestones by action", () => {
    const status = parseGitStatus(
      porcelain(
        "?? .rrmap/tasks/TASK-0042.md",
        " M .rrmap/tasks/TASK-0001.md",
        " D .rrmap/tasks/TASK-0003.md",
        "M  .rrmap/milestones/MILESTONE-0001.md",
      ),
    );
    expect(status.changes).toEqual([
      { action: "add", kind: "task", id: "TASK-0042" },
      { action: "update", kind: "task", id: "TASK-0001" },
      { action: "delete", kind: "task", id: "TASK-0003" },
      { action: "update", kind: "milestone", id: "MILESTONE-0001" },
    ]);
    expect(status.reordered).toEqual([]);
    expect(status.others).toEqual([]);
  });

  test("treats order.json as a reorder rather than a changed file", () => {
    const status = parseGitStatus(
      porcelain(" M .rrmap/tasks/order.json", " M .rrmap/milestones/order.json"),
    );
    expect(status.changes).toEqual([]);
    expect(status.reordered).toEqual(["task", "milestone"]);
  });

  test("keeps unknown files under .rrmap as others", () => {
    const status = parseGitStatus(porcelain("?? .rrmap/notes.md"));
    expect(status.others).toEqual([".rrmap/notes.md"]);
  });

  test("returns nothing for an empty output", () => {
    const status = parseGitStatus("");
    expect(hasChanges(status)).toBe(false);
  });
});

describe("buildCommitMessage", () => {
  test("names the id when a single item moved", () => {
    const status = parseGitStatus(porcelain("?? .rrmap/tasks/TASK-0042.md"));
    expect(buildCommitMessage(status)).toBe("chore(rrmap): add TASK-0042");
  });

  test("falls back to counts once an action covers several items", () => {
    const status = parseGitStatus(
      porcelain(
        "?? .rrmap/tasks/TASK-0042.md",
        " M .rrmap/tasks/TASK-0001.md",
        " M .rrmap/tasks/TASK-0002.md",
        " M .rrmap/tasks/TASK-0003.md",
      ),
    );
    expect(buildCommitMessage(status)).toBe("chore(rrmap): add TASK-0042, update 3 tasks");
  });

  test("splits counts per kind inside one action", () => {
    const status = parseGitStatus(
      porcelain(
        " M .rrmap/tasks/TASK-0001.md",
        " M .rrmap/tasks/TASK-0002.md",
        " M .rrmap/milestones/MILESTONE-0001.md",
      ),
    );
    expect(buildCommitMessage(status)).toBe("chore(rrmap): update 2 tasks, 1 milestone");
  });

  test("orders the actions as add, update, delete", () => {
    const status = parseGitStatus(
      porcelain(
        " D .rrmap/tasks/TASK-0003.md",
        " M .rrmap/tasks/TASK-0001.md",
        "?? .rrmap/tasks/TASK-0042.md",
      ),
    );
    expect(buildCommitMessage(status)).toBe(
      "chore(rrmap): add TASK-0042, update TASK-0001, delete TASK-0003",
    );
  });

  test("mentions a reorder alongside the other changes", () => {
    const status = parseGitStatus(
      porcelain("?? .rrmap/tasks/TASK-0042.md", " M .rrmap/tasks/order.json"),
    );
    expect(buildCommitMessage(status)).toBe("chore(rrmap): add TASK-0042, reorder tasks");
  });

  test("reports a reorder on its own", () => {
    const status = parseGitStatus(porcelain(" M .rrmap/milestones/order.json"));
    expect(buildCommitMessage(status)).toBe("chore(rrmap): reorder milestones");
  });

  test("falls back to the directory when only unknown files moved", () => {
    const status = parseGitStatus(porcelain("?? .rrmap/notes.md"));
    expect(buildCommitMessage(status)).toBe("chore(rrmap): update .rrmap");
  });
});

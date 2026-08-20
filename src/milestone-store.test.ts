import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  listMilestones,
  readMilestone,
  resolveMilestonesDir,
  writeMilestone,
} from "./milestone-store";

describe("milestone-store", () => {
  let dir: string;
  let milestonesDir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "rrmap-milestone-store-test-"));
    milestonesDir = join(dir, ".rrmap", "milestones");
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  test("resolveMilestonesDir joins baseDir with .rrmap/milestones", () => {
    expect(resolveMilestonesDir("/foo/bar")).toBe(join("/foo/bar", ".rrmap", "milestones"));
  });

  test("listMilestones returns [] when the directory doesn't exist", async () => {
    expect(await listMilestones(milestonesDir)).toEqual([]);
  });

  test("writeMilestone then readMilestone round-trips", async () => {
    await writeMilestone(milestonesDir, {
      id: "MILESTONE-0001",
      title: "テスト",
      status: "planned",
      hidden: false,
      body: "本文",
    });
    expect(await readMilestone(milestonesDir, "MILESTONE-0001")).toEqual({
      id: "MILESTONE-0001",
      title: "テスト",
      status: "planned",
      hidden: false,
      body: "本文",
    });
  });

  test("readMilestone throws for a missing id", async () => {
    await expect(readMilestone(milestonesDir, "MILESTONE-0999")).rejects.toThrow(
      "milestone not found: MILESTONE-0999",
    );
  });

  test("listMilestones sorts by id", async () => {
    await writeMilestone(milestonesDir, {
      id: "MILESTONE-0002",
      title: "b",
      status: "planned",
      hidden: false,
      body: "",
    });
    await writeMilestone(milestonesDir, {
      id: "MILESTONE-0001",
      title: "a",
      status: "planned",
      hidden: false,
      body: "",
    });
    const milestones = await listMilestones(milestonesDir);
    expect(milestones.map((milestone) => milestone.id)).toEqual([
      "MILESTONE-0001",
      "MILESTONE-0002",
    ]);
  });
});

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ARCHIVE_MILESTONE_ID, createArchiveMilestone } from "./milestone";
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

  test("listMilestones returns only the built-in archive when the directory doesn't exist", async () => {
    const milestones = await listMilestones(milestonesDir);
    expect(milestones.map((milestone) => milestone.id)).toEqual([ARCHIVE_MILESTONE_ID]);
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

  test("readMilestone returns the built-in archive without reading a file", async () => {
    expect(await readMilestone(milestonesDir, ARCHIVE_MILESTONE_ID)).toEqual(
      createArchiveMilestone(),
    );
  });

  test("writeMilestone rejects the built-in archive", async () => {
    await expect(writeMilestone(milestonesDir, createArchiveMilestone())).rejects.toThrow(
      /built-in/,
    );
  });

  test("readMilestone throws for a missing id", async () => {
    await expect(readMilestone(milestonesDir, "MILESTONE-0999")).rejects.toThrow(
      "milestone not found: MILESTONE-0999",
    );
  });

  test("listMilestones sorts by id and puts the built-in archive last", async () => {
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
      ARCHIVE_MILESTONE_ID,
    ]);
  });
});

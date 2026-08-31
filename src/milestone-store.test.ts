import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ARCHIVE_MILESTONE_ID, createArchiveMilestone } from "./milestone";
import {
  listMilestones,
  readMilestone,
  readMilestoneOrder,
  reorderMilestones,
  resolveMilestoneOrderPath,
  resolveMilestonesDir,
  writeMilestone,
  writeMilestoneOrder,
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

  async function seed(ids: string[]): Promise<void> {
    for (const id of ids) {
      await writeMilestone(milestonesDir, {
        id,
        title: id,
        status: "planned",
        hidden: false,
        body: "",
      });
    }
  }

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

  test("listMilestones follows order.json", async () => {
    await seed(["MILESTONE-0001", "MILESTONE-0002", "MILESTONE-0003"]);
    await writeMilestoneOrder(milestonesDir, ["MILESTONE-0003", "MILESTONE-0001"]);

    const milestones = await listMilestones(milestonesDir);
    expect(milestones.map((milestone) => milestone.id)).toEqual([
      "MILESTONE-0003",
      "MILESTONE-0001",
      // order.jsonに載っていないものはid順で後ろ
      "MILESTONE-0002",
      ARCHIVE_MILESTONE_ID,
    ]);
  });

  test("listMilestones falls back to id order when order.json is broken", async () => {
    await seed(["MILESTONE-0002", "MILESTONE-0001"]);
    await writeFile(resolveMilestoneOrderPath(milestonesDir), "{ broken", "utf8");

    const milestones = await listMilestones(milestonesDir);
    expect(milestones.map((milestone) => milestone.id)).toEqual([
      "MILESTONE-0001",
      "MILESTONE-0002",
      ARCHIVE_MILESTONE_ID,
    ]);
  });

  test("reorderMilestones saves the new order and returns the sorted milestones", async () => {
    await seed(["MILESTONE-0001", "MILESTONE-0002", "MILESTONE-0003"]);

    const milestones = await reorderMilestones(milestonesDir, [
      "MILESTONE-0002",
      "MILESTONE-0003",
      "MILESTONE-0001",
    ]);
    expect(milestones.map((milestone) => milestone.id)).toEqual([
      "MILESTONE-0002",
      "MILESTONE-0003",
      "MILESTONE-0001",
      ARCHIVE_MILESTONE_ID,
    ]);
    expect(await readMilestoneOrder(milestonesDir)).toEqual([
      "MILESTONE-0002",
      "MILESTONE-0003",
      "MILESTONE-0001",
    ]);
  });

  test("reorderMilestones keeps milestones it wasn't given in place", async () => {
    await seed(["MILESTONE-0001", "MILESTONE-0002", "MILESTONE-0003"]);

    // 非表示などで一覧に出ていないMILESTONE-0002は2番目のまま
    await reorderMilestones(milestonesDir, ["MILESTONE-0003", "MILESTONE-0001"]);
    expect(await readMilestoneOrder(milestonesDir)).toEqual([
      "MILESTONE-0003",
      "MILESTONE-0002",
      "MILESTONE-0001",
    ]);
  });

  test("reorderMilestones never writes the built-in archive into order.json", async () => {
    await seed(["MILESTONE-0001"]);

    await reorderMilestones(milestonesDir, [ARCHIVE_MILESTONE_ID, "MILESTONE-0001"]);
    expect(await readMilestoneOrder(milestonesDir)).toEqual(["MILESTONE-0001"]);
  });

  test("readMilestoneOrder returns an empty order when order.json doesn't exist", async () => {
    expect(await readMilestoneOrder(milestonesDir)).toEqual([]);
  });
});

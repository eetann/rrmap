import { describe, expect, test } from "bun:test";
import { ARCHIVE_MILESTONE_ID, createArchiveMilestone, type Milestone } from "./milestone";
import { sortMilestonesByOrder } from "./milestone-order";

function milestone(id: string): Milestone {
  return { id, title: id, status: "planned", hidden: false, body: "" };
}

describe("sortMilestonesByOrder", () => {
  test("follows the given order", () => {
    const milestones = [milestone("MILESTONE-0001"), milestone("MILESTONE-0002")];
    expect(
      sortMilestonesByOrder(milestones, ["MILESTONE-0002", "MILESTONE-0001"]).map((m) => m.id),
    ).toEqual(["MILESTONE-0002", "MILESTONE-0001"]);
  });

  test("puts milestones missing from the order last, sorted by id", () => {
    const milestones = [
      milestone("MILESTONE-0001"),
      milestone("MILESTONE-0002"),
      milestone("MILESTONE-0003"),
    ];
    expect(sortMilestonesByOrder(milestones, ["MILESTONE-0003"]).map((m) => m.id)).toEqual([
      "MILESTONE-0003",
      "MILESTONE-0001",
      "MILESTONE-0002",
    ]);
  });

  test("keeps the built-in archive last even when the order mentions it", () => {
    const milestones = [
      createArchiveMilestone(),
      milestone("MILESTONE-0001"),
      milestone("MILESTONE-0002"),
    ];
    expect(
      sortMilestonesByOrder(milestones, [ARCHIVE_MILESTONE_ID, "MILESTONE-0002"]).map((m) => m.id),
    ).toEqual(["MILESTONE-0002", "MILESTONE-0001", ARCHIVE_MILESTONE_ID]);
  });

  test("falls back to id order when the order is empty", () => {
    const milestones = [milestone("MILESTONE-0002"), milestone("MILESTONE-0001")];
    expect(sortMilestonesByOrder(milestones, []).map((m) => m.id)).toEqual([
      "MILESTONE-0001",
      "MILESTONE-0002",
    ]);
  });
});

import { describe, expect, test } from "bun:test";
import { ARCHIVE_MILESTONE_ID, createArchiveMilestone, type Milestone } from "./milestone";
import {
  applyPartialOrder,
  moveItem,
  parseMilestoneOrder,
  sortMilestonesByOrder,
  stringifyMilestoneOrder,
} from "./milestone-order";

function milestone(id: string): Milestone {
  return { id, title: id, status: "planned", hidden: false, body: "" };
}

describe("parseMilestoneOrder", () => {
  test("parses an array of ids", () => {
    expect(parseMilestoneOrder(`["MILESTONE-0002", "MILESTONE-0001"]`)).toEqual([
      "MILESTONE-0002",
      "MILESTONE-0001",
    ]);
  });

  test("drops non-string entries and duplicates", () => {
    expect(parseMilestoneOrder(`["MILESTONE-0001", 1, null, "MILESTONE-0001", ""]`)).toEqual([
      "MILESTONE-0001",
    ]);
  });

  test("returns an empty order when the JSON isn't an array", () => {
    expect(parseMilestoneOrder(`{"a": 1}`)).toEqual([]);
  });

  test("round-trips through stringifyMilestoneOrder", () => {
    const ids = ["MILESTONE-0003", "MILESTONE-0001"];
    expect(parseMilestoneOrder(stringifyMilestoneOrder(ids))).toEqual(ids);
  });
});

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

describe("applyPartialOrder", () => {
  test("reorders only the given ids, leaving the others in place", () => {
    // b と d は並び替え対象外なので、2番目・4番目のままでいてほしい
    expect(applyPartialOrder(["a", "b", "c", "d", "e"], ["e", "c", "a"])).toEqual([
      "e",
      "b",
      "c",
      "d",
      "a",
    ]);
  });

  test("ignores ids that aren't part of the full list", () => {
    expect(applyPartialOrder(["a", "b"], ["b", "zzz", "a"])).toEqual(["b", "a"]);
  });

  test("returns the full list unchanged for an empty subset", () => {
    expect(applyPartialOrder(["a", "b"], [])).toEqual(["a", "b"]);
  });
});

describe("moveItem", () => {
  test("moves an item down", () => {
    expect(moveItem(["a", "b", "c"], 0, 1)).toEqual(["b", "a", "c"]);
  });

  test("moves an item up", () => {
    expect(moveItem(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
  });

  test("returns the same array for an out-of-range move", () => {
    const items = ["a", "b"];
    expect(moveItem(items, 0, -1)).toBe(items);
    expect(moveItem(items, 1, 2)).toBe(items);
  });
});

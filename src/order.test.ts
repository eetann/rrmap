import { describe, expect, test } from "bun:test";
import { applyPartialOrder, moveItem, parseOrder, stringifyOrder } from "./order";

describe("parseOrder", () => {
  test("parses an array of ids", () => {
    expect(parseOrder(`["MILESTONE-0002", "MILESTONE-0001"]`)).toEqual([
      "MILESTONE-0002",
      "MILESTONE-0001",
    ]);
  });

  test("drops non-string entries and duplicates", () => {
    expect(parseOrder(`["MILESTONE-0001", 1, null, "MILESTONE-0001", ""]`)).toEqual([
      "MILESTONE-0001",
    ]);
  });

  test("returns an empty order when the JSON isn't an array", () => {
    expect(parseOrder(`{"a": 1}`)).toEqual([]);
  });

  test("round-trips through stringifyOrder", () => {
    const ids = ["MILESTONE-0003", "MILESTONE-0001"];
    expect(parseOrder(stringifyOrder(ids))).toEqual(ids);
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

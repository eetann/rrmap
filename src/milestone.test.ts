import { describe, expect, test } from "bun:test";
import {
  isMilestoneId,
  type Milestone,
  milestoneIdFromNumber,
  milestoneIdNumber,
  parseMilestone,
  stringifyMilestone,
} from "./milestone";

describe("parseMilestone", () => {
  test("parses a valid milestone", () => {
    const raw = `---
id: MILESTONE-0001
title: サンプル
status: planned
---
本文`;
    expect(parseMilestone(raw)).toEqual({
      id: "MILESTONE-0001",
      title: "サンプル",
      status: "planned",
      body: "本文",
    });
  });

  test("throws when id is missing", () => {
    const raw = `---
title: サンプル
status: planned
---
`;
    expect(() => parseMilestone(raw)).toThrow(/"id"/);
  });

  test("throws when id doesn't match the milestone id format", () => {
    const raw = `---
id: 1
title: サンプル
status: planned
---
`;
    expect(() => parseMilestone(raw)).toThrow(/"id"/);
  });

  test("throws when title is empty", () => {
    const raw = `---
id: MILESTONE-0001
title: ""
status: planned
---
`;
    expect(() => parseMilestone(raw)).toThrow(/"title"/);
  });

  test("throws when status is invalid", () => {
    const raw = `---
id: MILESTONE-0001
title: サンプル
status: unknown
---
`;
    expect(() => parseMilestone(raw)).toThrow(/"status"/);
  });
});

describe("stringifyMilestone", () => {
  test("round-trips through parseMilestone", () => {
    const milestone: Milestone = {
      id: "MILESTONE-0002",
      title: "往復確認",
      status: "active",
      body: "本文\n複数行",
    };
    expect(parseMilestone(stringifyMilestone(milestone))).toEqual(milestone);
  });
});

describe("isMilestoneId", () => {
  test("accepts a valid milestone id", () => {
    expect(isMilestoneId("MILESTONE-0001")).toBe(true);
  });

  test("rejects a non-milestone id", () => {
    expect(isMilestoneId("1")).toBe(false);
    expect(isMilestoneId("MILESTONE-1")).toBe(false);
    expect(isMilestoneId(null)).toBe(false);
  });
});

describe("milestoneIdFromNumber / milestoneIdNumber", () => {
  test("round-trips", () => {
    expect(milestoneIdFromNumber(1)).toBe("MILESTONE-0001");
    expect(milestoneIdNumber("MILESTONE-0001")).toBe(1);
  });
});

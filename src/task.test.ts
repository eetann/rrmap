import { describe, expect, test } from "bun:test";
import { parseTask, stringifyTask, type Task } from "./task";

describe("parseTask", () => {
  test("parses a valid task", () => {
    const raw = `---
id: 1
title: サンプル
status: draft
parent: null
milestone: null
---
本文`;
    expect(parseTask(raw)).toEqual({
      id: 1,
      title: "サンプル",
      status: "draft",
      parent: null,
      milestone: null,
      body: "本文",
    });
  });

  test("parses milestone id", () => {
    const raw = `---
id: 1
title: サンプル
status: draft
parent: null
milestone: MILESTONE-0001
---
本文`;
    expect(parseTask(raw).milestone).toBe("MILESTONE-0001");
  });

  test("defaults parent to null when omitted", () => {
    const raw = `---
id: 1
title: サンプル
status: draft
---
`;
    expect(parseTask(raw).parent).toBeNull();
  });

  test("defaults milestone to null when omitted", () => {
    const raw = `---
id: 1
title: サンプル
status: draft
---
`;
    expect(parseTask(raw).milestone).toBeNull();
  });

  test("throws when milestone is not a valid milestone id or null", () => {
    const raw = `---
id: 1
title: サンプル
status: draft
parent: null
milestone: not-a-milestone-id
---
`;
    expect(() => parseTask(raw)).toThrow(/"milestone"/);
  });

  test("throws when id is missing", () => {
    const raw = `---
title: サンプル
status: draft
parent: null
---
`;
    expect(() => parseTask(raw)).toThrow(/"id"/);
  });

  test("throws when title is empty", () => {
    const raw = `---
id: 1
title: ""
status: draft
parent: null
---
`;
    expect(() => parseTask(raw)).toThrow(/"title"/);
  });

  test("throws when status is invalid", () => {
    const raw = `---
id: 1
title: サンプル
status: unknown
parent: null
---
`;
    expect(() => parseTask(raw)).toThrow(/"status"/);
  });

  test("throws when parent is not an integer or null", () => {
    const raw = `---
id: 1
title: サンプル
status: draft
parent: "not-a-number"
---
`;
    expect(() => parseTask(raw)).toThrow(/"parent"/);
  });
});

describe("stringifyTask", () => {
  test("round-trips through parseTask", () => {
    const task: Task = {
      id: 2,
      title: "往復確認",
      status: "refined",
      parent: 1,
      milestone: "MILESTONE-0001",
      body: "本文\n複数行",
    };
    expect(parseTask(stringifyTask(task))).toEqual(task);
  });
});

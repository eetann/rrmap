import { describe, expect, test } from "bun:test";
import { buildRoute, DEFAULT_ROUTE, parseRoute, type Route } from "./route";

describe("parseRoute", () => {
  test("ルートパスはマイルストーンビュー", () => {
    expect(parseRoute("/")).toEqual({ view: "milestones", panel: null });
    expect(parseRoute("/milestones")).toEqual({ view: "milestones", panel: null });
  });

  test("/tasks はすべてのタスクビュー", () => {
    expect(parseRoute("/tasks")).toEqual({ view: "all", panel: null });
  });

  test("詳細パスは種別ごとの既定ビューを背景にする", () => {
    expect(parseRoute("/tasks/TASK-0030")).toEqual({
      view: "all",
      panel: { type: "task", id: "TASK-0030" },
    });
    expect(parseRoute("/milestones/MILESTONE-0001")).toEqual({
      view: "milestones",
      panel: { type: "milestone", id: "MILESTONE-0001" },
    });
  });

  test("?view= で背景ビューを上書きできる", () => {
    expect(parseRoute("/tasks/TASK-0030?view=milestones")).toEqual({
      view: "milestones",
      panel: { type: "task", id: "TASK-0030" },
    });
    expect(parseRoute("/milestones/MILESTONE-0001?view=all")).toEqual({
      view: "all",
      panel: { type: "milestone", id: "MILESTONE-0001" },
    });
  });

  test("不正な view は無視して既定ビューにする", () => {
    expect(parseRoute("/tasks/TASK-0030?view=unknown")).toEqual({
      view: "all",
      panel: { type: "task", id: "TASK-0030" },
    });
  });

  test("未知のパスや不正なIDは既定ルートに落とす", () => {
    expect(parseRoute("/unknown")).toEqual(DEFAULT_ROUTE);
    expect(parseRoute("/tasks/NOPE-0001")).toEqual(DEFAULT_ROUTE);
    expect(parseRoute("/milestones/TASK-0030")).toEqual(DEFAULT_ROUTE);
    expect(parseRoute("/tasks/TASK-0030/extra")).toEqual(DEFAULT_ROUTE);
  });

  test("絶対URLでも解釈できる", () => {
    expect(parseRoute("http://localhost:3000/tasks/TASK-0030")).toEqual({
      view: "all",
      panel: { type: "task", id: "TASK-0030" },
    });
  });
});

describe("buildRoute", () => {
  test("パネルなしはビューだけのパスになる", () => {
    expect(buildRoute({ view: "milestones", panel: null })).toBe("/");
    expect(buildRoute({ view: "all", panel: null })).toBe("/tasks");
  });

  test("既定ビューと同じならクエリを付けない", () => {
    expect(buildRoute({ view: "all", panel: { type: "task", id: "TASK-0030" } })).toBe(
      "/tasks/TASK-0030",
    );
    expect(
      buildRoute({ view: "milestones", panel: { type: "milestone", id: "MILESTONE-0001" } }),
    ).toBe("/milestones/MILESTONE-0001");
  });

  test("既定ビューと違うときだけ ?view= を付ける", () => {
    expect(buildRoute({ view: "milestones", panel: { type: "task", id: "TASK-0030" } })).toBe(
      "/tasks/TASK-0030?view=milestones",
    );
    expect(buildRoute({ view: "all", panel: { type: "milestone", id: "MILESTONE-0001" } })).toBe(
      "/milestones/MILESTONE-0001?view=all",
    );
  });
});

describe("parseRoute と buildRoute の往復", () => {
  const routes: Route[] = [
    { view: "milestones", panel: null },
    { view: "all", panel: null },
    { view: "all", panel: { type: "task", id: "TASK-0030" } },
    { view: "milestones", panel: { type: "task", id: "TASK-0030" } },
    { view: "milestones", panel: { type: "milestone", id: "MILESTONE-0001" } },
    { view: "all", panel: { type: "milestone", id: "MILESTONE-0001" } },
  ];

  test("buildRoute の結果を parseRoute すると元に戻る", () => {
    for (const route of routes) {
      expect(parseRoute(buildRoute(route))).toEqual(route);
    }
  });
});

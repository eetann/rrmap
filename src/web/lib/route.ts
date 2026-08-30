import { useCallback, useEffect, useState } from "react";
import { isMilestoneId } from "../../milestone";
import { isTaskId } from "../../task";

export const TASK_VIEWS = ["all", "milestones"] as const;

export type TaskView = (typeof TASK_VIEWS)[number];

export type RoutePanel = { type: "task"; id: string } | { type: "milestone"; id: string } | null;

export interface Route {
  view: TaskView;
  panel: RoutePanel;
}

export const DEFAULT_ROUTE: Route = { view: "milestones", panel: null };

function isTaskView(value: unknown): value is TaskView {
  return typeof value === "string" && (TASK_VIEWS as readonly string[]).includes(value);
}

/**
 * URL(パス+クエリ)からビューとサイドピークの状態を復元する。
 * 詳細パスの背景ビューは種別ごとの既定値(タスクなら"all")で、
 * それ以外の組み合わせのときだけ ?view= で上書きする。
 */
export function parseRoute(url: string): Route {
  const { pathname, searchParams } = new URL(url, "http://localhost");
  const segments = pathname.split("/").filter((segment) => segment !== "");
  const queryView = searchParams.get("view");
  const overrideView = isTaskView(queryView) ? queryView : null;
  const [first, second] = segments;

  if (first === "tasks") {
    if (segments.length === 1) {
      return { view: "all", panel: null };
    }
    if (segments.length === 2 && isTaskId(second)) {
      return { view: overrideView ?? "all", panel: { type: "task", id: second } };
    }
  }

  if (first === "milestones") {
    if (segments.length === 1) {
      return { view: "milestones", panel: null };
    }
    if (segments.length === 2 && isMilestoneId(second)) {
      return { view: overrideView ?? "milestones", panel: { type: "milestone", id: second } };
    }
  }

  return DEFAULT_ROUTE;
}

export function buildRoute({ view, panel }: Route): string {
  if (panel === null) {
    return view === "all" ? "/tasks" : "/";
  }
  if (panel.type === "task") {
    return view === "all" ? `/tasks/${panel.id}` : `/tasks/${panel.id}?view=${view}`;
  }
  return view === "milestones" ? `/milestones/${panel.id}` : `/milestones/${panel.id}?view=${view}`;
}

export function useRoute() {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.href));

  useEffect(() => {
    // 未知のパスや不正なクエリで開かれた場合、履歴を増やさずに正規のURLへ揃える
    const canonical = buildRoute(parseRoute(window.location.href));
    if (canonical !== `${window.location.pathname}${window.location.search}`) {
      window.history.replaceState(null, "", canonical);
    }

    const handlePopState = () => setRoute(parseRoute(window.location.href));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = useCallback((next: Route, options?: { replace?: boolean }) => {
    const url = buildRoute(next);
    if (options?.replace === true) {
      window.history.replaceState(null, "", url);
    } else {
      window.history.pushState(null, "", url);
    }
    setRoute(next);
  }, []);

  return { route, navigate };
}

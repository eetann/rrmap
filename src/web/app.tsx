import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDragReorder } from "@/lib/reorder";
import { type TaskView, useRoute } from "@/lib/route";
import { useSidebarCollapse } from "@/lib/sidebar-collapse";
import { ARCHIVE_MILESTONE_ID, isArchiveMilestoneId, type Milestone } from "../milestone";
import { sortMilestonesByOrder } from "../milestone-order";
import { applyPartialOrder } from "../order";
import type { Task } from "../task";
import { sortTasksByOrder } from "../task-order";
import { AddMilestoneRow } from "./components/add-milestone-row";
import { AllTasksList } from "./components/all-tasks-list";
import { PanelLeftIcon, SearchIcon } from "./components/icons";
import { MilestoneSection } from "./components/milestone-section";
import { Sidebar } from "./components/sidebar";
import { SidePeek, type SidePeekTarget } from "./components/side-peek";

export function App() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [milestones, setMilestones] = useState<Milestone[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  // サイドバーの＋から、ロードマップ側の入力欄を開かせるための合図
  const [addMilestoneRequested, setAddMilestoneRequested] = useState(false);
  const { route, navigate } = useRoute();
  const { collapsed: sidebarCollapsed, toggle: toggleSidebar } = useSidebarCollapse();
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const refresh = useCallback(() => {
    Promise.all([
      fetch("/api/tasks").then((res) => res.json() as Promise<Task[]>),
      fetch("/api/milestones").then((res) => res.json() as Promise<Milestone[]>),
    ])
      .then(([fetchedTasks, fetchedMilestones]) => {
        setTasks(fetchedTasks);
        setMilestones(fetchedMilestones);
      })
      .catch((err) => setError(String(err)));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    fetch("/api/project")
      .then((res) => res.json() as Promise<{ name: string }>)
      .then(({ name }) => {
        document.title = `${name} | rrmap`;
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const source = new EventSource("/api/events");
    source.addEventListener("changed", () => refresh());
    return () => source.close();
  }, [refresh]);

  const changeView = useCallback(
    (view: TaskView) => navigate({ view, panel: route.panel }),
    [navigate, route.panel],
  );

  const openTask = useCallback(
    (id: string) => navigate({ view: route.view, panel: { type: "task", id } }),
    [navigate, route.view],
  );

  const openMilestone = useCallback(
    (id: string) => navigate({ view: route.view, panel: { type: "milestone", id } }),
    [navigate, route.view],
  );

  const closePanel = useCallback(
    () => navigate({ view: route.view, panel: null }),
    [navigate, route.view],
  );

  const schedulePatch = useCallback(
    (url: string, key: string, body: Record<string, unknown>, debounce: boolean) => {
      const timers = debounceTimers.current;
      const existing = timers[key];
      if (existing !== undefined) {
        clearTimeout(existing);
      }
      const send = () => {
        delete timers[key];
        fetch(url, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }).catch(() => {});
      };
      if (debounce) {
        timers[key] = setTimeout(send, 500);
      } else {
        send();
      }
    },
    [],
  );

  const updateTask = useCallback(
    (
      id: string,
      patch: Partial<Pick<Task, "title" | "status" | "milestone" | "parent" | "body">>,
      debounce = false,
    ) => {
      setTasks((prev) => prev?.map((t) => (t.id === id ? { ...t, ...patch } : t)) ?? prev);
      const field = Object.keys(patch)[0] ?? "misc";
      schedulePatch(`/api/tasks/${id}`, `task-${id}-${field}`, patch, debounce);
    },
    [schedulePatch],
  );

  const archiveTasks = useCallback(
    (ids: string[]) => {
      for (const id of ids) {
        updateTask(id, { milestone: ARCHIVE_MILESTONE_ID });
      }
    },
    [updateTask],
  );

  const archiveTask = useCallback((id: string) => archiveTasks([id]), [archiveTasks]);

  const updateMilestone = useCallback(
    (
      id: string,
      patch: Partial<Pick<Milestone, "title" | "status" | "hidden" | "body">>,
      debounce = false,
    ) => {
      setMilestones((prev) => prev?.map((m) => (m.id === id ? { ...m, ...patch } : m)) ?? prev);
      const field = Object.keys(patch)[0] ?? "misc";
      schedulePatch(`/api/milestones/${id}`, `milestone-${id}-${field}`, patch, debounce);
    },
    [schedulePatch],
  );

  const reorderMilestones = useCallback((reorderedIds: string[]) => {
    setMilestones((prev) => {
      if (!prev) {
        return prev;
      }
      const fullIds = prev.filter((m) => !isArchiveMilestoneId(m.id)).map((m) => m.id);
      return sortMilestonesByOrder(prev, applyPartialOrder(fullIds, reorderedIds));
    });
    fetch("/api/milestones/order", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: reorderedIds }),
    }).catch(() => {});
  }, []);

  const reorderTasks = useCallback((reorderedIds: string[]) => {
    setTasks((prev) =>
      prev
        ? sortTasksByOrder(
            prev,
            applyPartialOrder(
              prev.map((t) => t.id),
              reorderedIds,
            ),
          )
        : prev,
    );
    fetch("/api/tasks/order", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: reorderedIds }),
    }).catch(() => {});
  }, []);

  // 一覧とサイドバーで同じ並びを共有するので、フックも1つで済ませる
  const visibleMilestoneIds = useMemo(
    () => (milestones ?? []).filter((m) => !m.hidden).map((m) => m.id),
    [milestones],
  );
  const { getControls } = useDragReorder(visibleMilestoneIds, reorderMilestones);

  const addTask = useCallback(async (milestoneId: string | null, title: string) => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, milestone: milestoneId }),
    });
    if (!res.ok) {
      return;
    }
    const created = (await res.json()) as Task;
    setTasks((prev) => (prev ? [...prev, created] : prev));
  }, []);

  const addMilestone = useCallback(
    async (title: string) => {
      const res = await fetch("/api/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) {
        return;
      }
      const created = (await res.json()) as Milestone;
      setMilestones((prev) => (prev ? [...prev, created] : prev));
      // 方針や背景をすぐ書き足せるよう、作ったマイルストーンの詳細を開く
      navigate({ view: "milestones", panel: { type: "milestone", id: created.id } });
    },
    [navigate],
  );

  const requestAddMilestone = useCallback(() => {
    // 「すべてのタスク」から押されることもあるので、入力欄のあるビューへ連れていく
    navigate({ view: "milestones", panel: route.panel });
    setAddMilestoneRequested(true);
  }, [navigate, route.panel]);

  const clearAddMilestoneRequest = useCallback(() => setAddMilestoneRequested(false), []);

  const deleteTask = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) {
        return;
      }
      setTasks((prev) => prev?.filter((t) => t.id !== id) ?? prev);
      if (route.panel?.type === "task" && route.panel.id === id) {
        // 削除済みタスクのURLへ「戻る」で行けてしまわないよう履歴を置き換える
        navigate({ view: route.view, panel: null }, { replace: true });
      }
    },
    [navigate, route],
  );

  if (error) {
    return <div className="p-6 text-destructive">読み込みに失敗しました: {error}</div>;
  }
  if (!tasks || !milestones) {
    return <div className="p-6 text-muted-foreground">読み込み中...</div>;
  }

  const normalizedQuery = query.trim().toLowerCase();
  const filteredTasks =
    normalizedQuery === ""
      ? tasks
      : tasks.filter((t) => t.title.toLowerCase().includes(normalizedQuery));
  const unassignedTasks = filteredTasks.filter((t) => t.milestone === null);
  const visibleMilestones = milestones.filter((m) => !m.hidden);
  // 空のアーカイブはサイドバーに出さない（マイルストーンの選択肢としては常に出す）
  const hiddenMilestones = milestones.filter(
    (m) =>
      m.hidden &&
      (m.id !== ARCHIVE_MILESTONE_ID || tasks.some((t) => t.milestone === ARCHIVE_MILESTONE_ID)),
  );

  let target: SidePeekTarget | null = null;
  if (route.panel?.type === "task") {
    const task = tasks.find((t) => t.id === route.panel?.id);
    target = task ? { type: "task", task } : null;
  } else if (route.panel?.type === "milestone") {
    const milestone = milestones.find((m) => m.id === route.panel?.id);
    target = milestone
      ? {
          type: "milestone",
          milestone,
          relatedTasks: tasks.filter((t) => t.milestone === milestone.id),
        }
      : null;
  }

  // 画面の高さに収めて、サイドバー・一覧・詳細をそれぞれ独立してスクロールさせる
  return (
    <div className="flex h-screen overflow-hidden">
      {!sidebarCollapsed && (
        <Sidebar
          visibleMilestones={visibleMilestones}
          hiddenMilestones={hiddenMilestones}
          tasks={tasks}
          view={route.view}
          onChangeView={changeView}
          onOpenMilestone={openMilestone}
          onAddMilestone={requestAddMilestone}
          onToggleCollapse={toggleSidebar}
          getReorderControls={getControls}
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* 一覧をスクロールしても使えるよう、検索と見出しはスクロール領域の外に置く */}
        <div className="flex flex-shrink-0 items-center justify-between px-14 pt-11 pb-5">
          <div className="flex min-w-0 items-center gap-3">
            {/* 開いているときの閉じるボタンはサイドバー側にあるので、ここは開くためだけに出す */}
            {sidebarCollapsed && (
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label="サイドバーを開く"
                className="flex-shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <PanelLeftIcon />
              </button>
            )}
            <h1 className="min-w-0 truncate text-[23px] font-bold">
              {route.view === "all" ? "すべてのタスク" : "ロードマップ"}
            </h1>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-muted-foreground">
            <SearchIcon />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="検索"
              className="w-[180px] border-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-14 pt-3 pb-16">
          {route.view === "all" ? (
            <AllTasksList tasks={filteredTasks} milestones={milestones} onOpenTask={openTask} />
          ) : (
            <>
              {visibleMilestones.map((milestone) => (
                <MilestoneSection
                  key={milestone.id}
                  milestone={milestone}
                  tasks={filteredTasks.filter((t) => t.milestone === milestone.id)}
                  onOpenTask={openTask}
                  onOpenMilestone={openMilestone}
                  onAddTask={(title) => addTask(milestone.id, title)}
                  onReorderTasks={reorderTasks}
                  reorder={getControls(milestone.id)}
                />
              ))}

              {/* 新しいマイルストーンは並び順の末尾に来るので、押した場所のすぐ上に現れる */}
              <AddMilestoneRow
                onAdd={addMilestone}
                openRequested={addMilestoneRequested}
                onOpenHandled={clearAddMilestoneRequest}
              />

              <MilestoneSection
                milestone={null}
                tasks={unassignedTasks}
                onOpenTask={openTask}
                onOpenMilestone={() => {}}
                onAddTask={(title) => addTask(null, title)}
                onArchiveTasks={archiveTasks}
                onReorderTasks={reorderTasks}
              />
            </>
          )}
        </div>
      </div>

      {target && (
        <SidePeek
          target={target}
          tasks={tasks}
          milestones={milestones}
          onClose={closePanel}
          onTaskChange={updateTask}
          onTaskArchive={archiveTask}
          onTaskDelete={deleteTask}
          onMilestoneChange={updateMilestone}
          onOpenTask={openTask}
        />
      )}
    </div>
  );
}

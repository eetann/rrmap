import { useCallback, useEffect, useRef, useState } from "react";
import { type TaskView, useRoute } from "@/lib/route";
import type { Milestone } from "../milestone";
import type { Task } from "../task";
import { AllTasksList } from "./components/all-tasks-list";
import { SearchIcon } from "./components/icons";
import { MilestoneSection } from "./components/milestone-section";
import { Sidebar } from "./components/sidebar";
import { SidePeek, type SidePeekTarget } from "./components/side-peek";

export function App() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [milestones, setMilestones] = useState<Milestone[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const { route, navigate } = useRoute();
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
      patch: Partial<Pick<Task, "title" | "status" | "milestone" | "body">>,
      debounce = false,
    ) => {
      setTasks((prev) => prev?.map((t) => (t.id === id ? { ...t, ...patch } : t)) ?? prev);
      const field = Object.keys(patch)[0] ?? "misc";
      schedulePatch(`/api/tasks/${id}`, `task-${id}-${field}`, patch, debounce);
    },
    [schedulePatch],
  );

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
  const hiddenMilestones = milestones.filter((m) => m.hidden);

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

  return (
    <div className="flex min-h-screen">
      <Sidebar
        visibleMilestones={visibleMilestones}
        hiddenMilestones={hiddenMilestones}
        tasks={tasks}
        view={route.view}
        onChangeView={changeView}
        onOpenMilestone={openMilestone}
      />
      <div className="min-w-0 flex-1 px-14 py-11 pb-16">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-[23px] font-bold">
            {route.view === "all" ? "すべてのタスク" : "マイルストーン"}
          </h1>
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
              />
            ))}

            <MilestoneSection
              milestone={null}
              tasks={unassignedTasks}
              onOpenTask={openTask}
              onOpenMilestone={() => {}}
              onAddTask={(title) => addTask(null, title)}
            />
          </>
        )}
      </div>

      {target && (
        <SidePeek
          target={target}
          milestones={milestones}
          onClose={closePanel}
          onTaskChange={updateTask}
          onTaskDelete={deleteTask}
          onMilestoneChange={updateMilestone}
          onOpenTask={openTask}
        />
      )}
    </div>
  );
}

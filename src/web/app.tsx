import { useCallback, useEffect, useRef, useState } from "react";
import type { Milestone } from "../milestone";
import type { Task } from "../task";
import { SearchIcon } from "./components/icons";
import { MilestoneSection } from "./components/milestone-section";
import { Sidebar } from "./components/sidebar";
import { SidePeek, type SidePeekTarget } from "./components/side-peek";

type OpenPanel = { type: "task"; id: number } | { type: "milestone"; id: string } | null;

export function App() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [milestones, setMilestones] = useState<Milestone[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [query, setQuery] = useState("");
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
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
    (id: number, patch: Partial<Pick<Task, "title" | "status" | "milestone" | "body">>, debounce = false) => {
      setTasks((prev) => prev?.map((t) => (t.id === id ? { ...t, ...patch } : t)) ?? prev);
      const field = Object.keys(patch)[0] ?? "misc";
      schedulePatch(`/api/tasks/${id}`, `task-${id}-${field}`, patch, debounce);
    },
    [schedulePatch],
  );

  const updateMilestone = useCallback(
    (id: string, patch: Partial<Pick<Milestone, "title" | "status" | "body">>, debounce = false) => {
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

  if (error) {
    return <div className="p-6 text-destructive">読み込みに失敗しました: {error}</div>;
  }
  if (!tasks || !milestones) {
    return <div className="p-6 text-muted-foreground">読み込み中...</div>;
  }

  const normalizedQuery = query.trim().toLowerCase();
  const filteredTasks =
    normalizedQuery === "" ? tasks : tasks.filter((t) => t.title.toLowerCase().includes(normalizedQuery));
  const unassignedTasks = filteredTasks.filter((t) => t.milestone === null);

  let target: SidePeekTarget | null = null;
  if (openPanel?.type === "task") {
    const task = tasks.find((t) => t.id === openPanel.id);
    target = task ? { type: "task", task } : null;
  } else if (openPanel?.type === "milestone") {
    const milestone = milestones.find((m) => m.id === openPanel.id);
    target = milestone
      ? { type: "milestone", milestone, relatedTasks: tasks.filter((t) => t.milestone === milestone.id) }
      : null;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        milestones={milestones}
        tasks={tasks}
        onOpenMilestone={(id) => setOpenPanel({ type: "milestone", id })}
      />
      <div className="flex-1 px-14 py-11 pb-16">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-[23px] font-bold">タスク</h1>
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

        {milestones.map((milestone) => (
          <MilestoneSection
            key={milestone.id}
            milestone={milestone}
            tasks={filteredTasks.filter((t) => t.milestone === milestone.id)}
            onOpenTask={(id) => setOpenPanel({ type: "task", id })}
            onOpenMilestone={(id) => setOpenPanel({ type: "milestone", id })}
            onAddTask={(title) => addTask(milestone.id, title)}
          />
        ))}

        <MilestoneSection
          milestone={null}
          tasks={unassignedTasks}
          onOpenTask={(id) => setOpenPanel({ type: "task", id })}
          onOpenMilestone={() => {}}
          onAddTask={(title) => addTask(null, title)}
        />
      </div>

      {target && (
        <SidePeek
          target={target}
          milestones={milestones}
          onClose={() => setOpenPanel(null)}
          onTaskChange={updateTask}
          onMilestoneChange={updateMilestone}
          onOpenTask={(id) => setOpenPanel({ type: "task", id })}
        />
      )}
    </div>
  );
}

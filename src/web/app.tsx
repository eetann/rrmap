import { useEffect, useState } from "react";
import type { Milestone } from "../milestone";
import type { Task } from "../task";
import { TaskTable } from "./components/task-table";

export function App() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [milestones, setMilestones] = useState<Milestone[] | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  if (error) {
    return <div className="text-destructive p-6">読み込みに失敗しました: {error}</div>;
  }
  if (!tasks || !milestones) {
    return <div className="text-muted-foreground p-6">読み込み中...</div>;
  }

  const unassigned = tasks.filter((task) => task.milestone === null);

  return (
    <div className="mx-auto max-w-5xl space-y-10 p-6">
      <h1 className="text-2xl font-semibold">rrmap</h1>
      {milestones.map((milestone) => (
        <section key={milestone.id} className="space-y-3">
          <h2 className="text-lg font-medium">
            {milestone.title}
            <span className="text-muted-foreground ml-2 text-sm font-normal">
              {milestone.id} · {milestone.status}
            </span>
          </h2>
          <TaskTable tasks={tasks.filter((task) => task.milestone === milestone.id)} />
        </section>
      ))}
      <section className="space-y-3">
        <h2 className="text-lg font-medium">未分類</h2>
        <TaskTable tasks={unassigned} />
      </section>
    </div>
  );
}

import type { Milestone } from "../../milestone";
import { taskIdNumber, type Task } from "../../task";
import { TaskRow } from "./task-row";

export function AllTasksList({
  tasks,
  milestones,
  onOpenTask,
}: {
  tasks: Task[];
  milestones: Milestone[];
  onOpenTask: (id: string) => void;
}) {
  const milestoneTitleById = new Map(milestones.map((m) => [m.id, m.title]));
  const sortedTasks = [...tasks].sort((a, b) => taskIdNumber(b.id) - taskIdNumber(a.id));

  return (
    <section className="mb-8">
      <div className="flex flex-col border-t border-border">
        {sortedTasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onClick={() => onOpenTask(task.id)}
            milestoneLabel={
              task.milestone === null
                ? "未分類"
                : (milestoneTitleById.get(task.milestone) ?? "未分類")
            }
          />
        ))}
      </div>
      {sortedTasks.length === 0 && (
        <div className="py-6 text-center text-sm text-muted-foreground">タスクがありません</div>
      )}
    </section>
  );
}

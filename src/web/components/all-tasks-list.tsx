import { Fragment } from "react";
import { buildTaskTree } from "@/lib/task-tree";
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
  const nodes = buildTaskTree(sortedTasks);
  const milestoneLabelOf = (task: Task) =>
    task.milestone === null ? "未分類" : (milestoneTitleById.get(task.milestone) ?? "未分類");

  return (
    <section className="mb-8">
      <div className="flex flex-col border-t border-border">
        {nodes.map((node) => (
          <Fragment key={node.task.id}>
            <TaskRow
              task={node.task}
              onClick={() => onOpenTask(node.task.id)}
              milestoneLabel={milestoneLabelOf(node.task)}
            />
            {node.children.map((child) => (
              <TaskRow
                key={child.id}
                task={child}
                onClick={() => onOpenTask(child.id)}
                milestoneLabel={milestoneLabelOf(child)}
                isChild
              />
            ))}
          </Fragment>
        ))}
      </div>
      {sortedTasks.length === 0 && (
        <div className="py-6 text-center text-sm text-muted-foreground">タスクがありません</div>
      )}
    </section>
  );
}

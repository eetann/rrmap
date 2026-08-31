import { MILESTONE_STATUS_META } from "@/lib/status";
import type { Milestone } from "../../milestone";
import type { Task } from "../../task";
import { AddTaskRow } from "./add-task-row";
import { CopyIdButton } from "./copy-id-button";
import { ArchiveIcon } from "./icons";
import { TaskRow } from "./task-row";

export function MilestoneSection({
  milestone,
  tasks,
  onOpenTask,
  onOpenMilestone,
  onAddTask,
  onArchiveTasks,
}: {
  milestone: Milestone | null;
  tasks: Task[];
  onOpenTask: (id: string) => void;
  onOpenMilestone: (id: string) => void;
  onAddTask: (title: string) => Promise<void>;
  // 未分類セクションでだけ使う。片付いたタスクをまとめてアーカイブへ移す
  onArchiveTasks?: (ids: string[]) => void;
}) {
  const doneCount = tasks.filter((t) => t.status === "done").length;
  const progressPct = tasks.length === 0 ? 0 : Math.round((doneCount / tasks.length) * 100);
  const meta = milestone ? MILESTONE_STATUS_META[milestone.status] : null;
  const archivableTasks =
    milestone === null && onArchiveTasks
      ? tasks.filter((t) => t.status === "done" || t.status === "cancelled")
      : [];

  return (
    <section className="mb-8">
      <div className="mb-2 flex items-baseline justify-between">
        <div className="flex items-center gap-2.5">
          {milestone ? (
            <button
              type="button"
              onClick={() => onOpenMilestone(milestone.id)}
              className="-mx-1.5 cursor-pointer rounded-md px-1.5 py-0.5 text-left text-base font-semibold hover:bg-muted"
            >
              {milestone.title}
            </button>
          ) : (
            <span className="text-base font-medium text-muted-foreground">未分類</span>
          )}
          {milestone && meta && (
            <span
              className="rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold tracking-wide uppercase"
              style={{ background: meta.bg, color: meta.fg }}
            >
              {meta.label}
            </span>
          )}
        </div>
        {archivableTasks.length > 0 && onArchiveTasks && (
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  `完了・中止の${archivableTasks.length}件をアーカイブへ移動しますか？（アーカイブからは戻せます）`,
                )
              ) {
                onArchiveTasks(archivableTasks.map((t) => t.id));
              }
            }}
            className="flex flex-shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArchiveIcon size={13} />
            完了・中止 {archivableTasks.length} 件をアーカイブ
          </button>
        )}
        {milestone && (
          <div className="flex flex-shrink-0 items-center gap-3">
            <span className="text-xs text-muted-foreground tabular-nums">
              {doneCount} / {tasks.length} 完了
            </span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground tabular-nums">{milestone.id}</span>
              <CopyIdButton id={milestone.id} />
            </div>
          </div>
        )}
      </div>
      {milestone && (
        <div className="mb-3.5 h-1 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full"
            style={{ width: `${progressPct}%`, background: "var(--status-done)" }}
          />
        </div>
      )}
      <div className="flex flex-col border-t border-border">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} onClick={() => onOpenTask(task.id)} />
        ))}
      </div>
      <AddTaskRow onAdd={onAddTask} />
    </section>
  );
}

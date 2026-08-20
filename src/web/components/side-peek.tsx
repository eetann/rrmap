import { useEffect, useRef } from "react";
import { MILESTONE_STATUS_META, MILESTONE_STATUS_OPTIONS, TASK_STATUS_META, TASK_STATUS_OPTIONS } from "@/lib/status";
import type { Milestone, MilestoneStatus } from "../../milestone";
import type { Task, TaskStatus } from "../../task";
import { XIcon } from "./icons";

export type SidePeekTarget =
  | { type: "task"; task: Task }
  | { type: "milestone"; milestone: Milestone; relatedTasks: Task[] };

export function SidePeek({
  target,
  milestones,
  onClose,
  onTaskChange,
  onMilestoneChange,
  onOpenTask,
}: {
  target: SidePeekTarget;
  milestones: Milestone[];
  onClose: () => void;
  onTaskChange: (id: string, patch: Partial<Pick<Task, "title" | "status" | "milestone" | "body">>, debounce?: boolean) => void;
  onMilestoneChange: (id: string, patch: Partial<Pick<Milestone, "title" | "status" | "body">>, debounce?: boolean) => void;
  onOpenTask: (id: string) => void;
}) {
  const titleRef = useRef<HTMLInputElement>(null);
  const targetKey = target.type === "task" ? `task-${target.task.id}` : `milestone-${target.milestone.id}`;

  useEffect(() => {
    titleRef.current?.focus();
    titleRef.current?.select();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const idLabel = target.type === "task" ? `#${target.task.id}` : target.milestone.id;
  const title = target.type === "task" ? target.task.title : target.milestone.title;
  const body = target.type === "task" ? target.task.body : target.milestone.body;
  const statusMeta =
    target.type === "task" ? TASK_STATUS_META[target.task.status] : MILESTONE_STATUS_META[target.milestone.status];

  const handleTitleChange = (value: string) => {
    if (target.type === "task") {
      onTaskChange(target.task.id, { title: value }, true);
    } else {
      onMilestoneChange(target.milestone.id, { title: value }, true);
    }
  };

  const handleBodyChange = (value: string) => {
    if (target.type === "task") {
      onTaskChange(target.task.id, { body: value }, true);
    } else {
      onMilestoneChange(target.milestone.id, { body: value }, true);
    }
  };

  const handleStatusChange = (value: string) => {
    if (target.type === "task") {
      onTaskChange(target.task.id, { status: value as TaskStatus });
    } else {
      onMilestoneChange(target.milestone.id, { status: value as MilestoneStatus });
    }
  };

  return (
    <>
      <div
        role="presentation"
        onClick={onClose}
        className="fixed inset-0 z-40"
        style={{ background: "oklch(0.15 0.01 260 / 0.32)", animation: "side-peek-fade-in 140ms ease-out" }}
      />
      <div
        key={targetKey}
        className="fixed top-0 right-0 bottom-0 z-50 flex w-[420px] flex-col border-l border-border bg-background shadow-2xl"
        style={{ animation: "side-peek-slide-in 160ms ease-out" }}
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <span className="text-xs text-muted-foreground tabular-nums">{idLabel}</span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <XIcon />
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-4.5 overflow-y-auto px-6 py-5.5">
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full border-b border-transparent bg-transparent py-1 text-[19px] font-bold text-foreground outline-none focus:border-primary"
          />

          <div className="flex items-center gap-3 text-[13px]">
            <span className="w-[88px] flex-shrink-0 text-muted-foreground">ステータス</span>
            <div
              className="inline-flex w-fit items-center rounded-full pl-3"
              style={{ background: statusMeta.bg, color: statusMeta.fg }}
            >
              <select
                value={target.type === "task" ? target.task.status : target.milestone.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="cursor-pointer appearance-none bg-transparent py-1.5 pr-5 text-[12.5px] font-semibold outline-none"
                style={{ color: "inherit" }}
              >
                {target.type === "task"
                  ? TASK_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {TASK_STATUS_META[status].label}
                      </option>
                    ))
                  : MILESTONE_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {MILESTONE_STATUS_META[status].label}
                      </option>
                    ))}
              </select>
            </div>
          </div>

          {target.type === "task" && (
            <div className="flex items-center gap-3 text-[13px]">
              <span className="w-[88px] flex-shrink-0 text-muted-foreground">マイルストーン</span>
              <select
                value={target.task.milestone ?? ""}
                onChange={(e) =>
                  onTaskChange(target.task.id, { milestone: e.target.value === "" ? null : e.target.value })
                }
                className="flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-[13px] text-foreground"
              >
                <option value="">未分類</option>
                {milestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="h-px bg-border" />

          <textarea
            value={body}
            onChange={(e) => handleBodyChange(e.target.value)}
            placeholder="メモを書く（方針・意思決定など）"
            className="min-h-[170px] w-full flex-1 resize-y border-none bg-transparent text-[13.5px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
          />

          {target.type === "milestone" && (
            <div className="flex flex-col gap-1.5">
              <div className="mb-0.5 text-[11px] tracking-wide text-muted-foreground uppercase">
                このマイルストーンのタスク
              </div>
              {target.relatedTasks.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">タスクなし</p>
              ) : (
                target.relatedTasks.map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => onOpenTask(t.id)}
                    className="rounded-lg border border-border px-3 py-2 text-left text-[13px] hover:bg-muted"
                  >
                    {t.title}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

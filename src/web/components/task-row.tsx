import { TASK_STATUS_META } from "@/lib/status";
import type { Task } from "../../task";
import { CopyIdButton } from "./copy-id-button";
import { CheckIcon } from "./icons";

export function TaskRow({ task, onClick }: { task: Task; onClick: () => void }) {
  const meta = TASK_STATUS_META[task.status];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="flex cursor-pointer items-center gap-3 border-b border-border px-1.5 py-3 hover:bg-muted"
    >
      <div className="flex w-[18px] flex-shrink-0 items-center justify-center">
        {task.status === "done" ? (
          <span
            className="flex h-[18px] w-[18px] items-center justify-center rounded-full"
            style={{ background: "var(--status-done)" }}
          >
            <CheckIcon />
          </span>
        ) : (
          <span className="block h-[9px] w-[9px] rounded-full" style={{ background: meta.dot }} />
        )}
      </div>
      <div
        className="min-w-0 flex-1 break-words text-sm leading-relaxed"
        style={
          task.status === "cancelled"
            ? { textDecoration: "line-through", color: "var(--muted-foreground)" }
            : undefined
        }
      >
        {task.title}
      </div>
      <div className="flex flex-shrink-0 items-center gap-1">
        <span className="text-xs text-muted-foreground tabular-nums">{task.id}</span>
        <CopyIdButton id={task.id} />
      </div>
    </div>
  );
}

import type { ReorderControls } from "@/lib/reorder";
import { TASK_STATUS_META } from "@/lib/status";
import { cn } from "@/lib/utils";
import type { Task } from "../../task";
import { CopyIdButton } from "./copy-id-button";
import { CheckIcon } from "./icons";
import { ReorderControlsGroup } from "./reorder-controls";

export function TaskRow({
  task,
  onClick,
  milestoneLabel,
  isChild = false,
  reorder,
}: {
  task: Task;
  onClick: () => void;
  milestoneLabel?: string;
  // 親タスクの直下にぶら下がる子タスクは字下げして見せる
  isChild?: boolean;
  // 並び替えできない一覧（すべてのタスクなど）では渡さない
  reorder?: ReorderControls;
}) {
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
      {...reorder?.itemProps}
      className={cn(
        "group/task flex cursor-pointer items-center gap-3 border-b border-border px-1.5 py-3 hover:bg-muted",
        isChild && "pl-8",
        reorder?.isDragging === true && "opacity-40",
        reorder?.isOver === true && "border-b-transparent ring-2 ring-ring",
      )}
    >
      <div className="flex w-[18px] flex-shrink-0 items-center justify-center">
        {task.status === "done" ? (
          <span
            className="flex h-[18px] w-[18px] items-center justify-center rounded-full"
            style={{ background: "var(--status-done)" }}
          >
            <CheckIcon className="text-white" />
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
      <div className="flex flex-shrink-0 items-center gap-2">
        {reorder && (
          // 行のどこをクリックしても詳細が開くので、並び替えの操作はここで止める
          <span
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            className="opacity-0 transition-opacity group-hover/task:opacity-100 focus-within:opacity-100"
          >
            <ReorderControlsGroup controls={reorder} direction="horizontal" />
          </span>
        )}
        {milestoneLabel !== undefined && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            {milestoneLabel}
          </span>
        )}
        <span className="text-xs text-muted-foreground tabular-nums">{task.id}</span>
        <CopyIdButton id={task.id} />
      </div>
    </div>
  );
}

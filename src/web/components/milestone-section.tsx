import { Fragment, useState } from "react";
import { type ReorderControls, useDragReorder } from "@/lib/reorder";
import { MILESTONE_STATUS_META } from "@/lib/status";
import { buildTaskTree } from "@/lib/task-tree";
import { cn } from "@/lib/utils";
import type { Milestone } from "../../milestone";
import { isHideableTaskStatus, type Task } from "../../task";
import { AddTaskRow } from "./add-task-row";
import { CopyIdButton } from "./copy-id-button";
import { ArchiveIcon, EyeIcon, EyeOffIcon } from "./icons";
import { ReorderControlsGroup } from "./reorder-controls";
import { TaskRow, type TaskRowVisibilityAction } from "./task-row";

type GetVisibilityAction = (task: Task) => TaskRowVisibilityAction | undefined;

/**
 * 同じ親を持つタスクだけで並び替えるので、子タスクの一覧は別のフックを持たせる。
 * 並び順そのものはマイルストーンをまたいだ1本の配列なので、
 * 親でも子でも「並べ替えた一覧のid」をそのまま送れば足りる。
 */
function ChildTaskRows({
  tasks,
  onOpenTask,
  onReorderTasks,
  getVisibilityAction,
}: {
  tasks: Task[];
  onOpenTask: (id: string) => void;
  onReorderTasks: (ids: string[]) => void;
  getVisibilityAction: GetVisibilityAction;
}) {
  const { getControls } = useDragReorder(
    tasks.map((task) => task.id),
    onReorderTasks,
  );

  return (
    <>
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          onClick={() => onOpenTask(task.id)}
          reorder={getControls(task.id)}
          visibilityAction={getVisibilityAction(task)}
          isChild
        />
      ))}
    </>
  );
}

function TaskRows({
  tasks,
  onOpenTask,
  onReorderTasks,
  getVisibilityAction,
}: {
  tasks: Task[];
  onOpenTask: (id: string) => void;
  onReorderTasks: (ids: string[]) => void;
  getVisibilityAction: GetVisibilityAction;
}) {
  const nodes = buildTaskTree(tasks);
  // 子タスクは親についていくので、並び替えの対象はトップレベルのタスクだけ
  const { getControls } = useDragReorder(
    nodes.map((node) => node.task.id),
    onReorderTasks,
  );

  return (
    <div className="flex flex-col border-t border-border">
      {nodes.map((node) => (
        <Fragment key={node.task.id}>
          <TaskRow
            task={node.task}
            onClick={() => onOpenTask(node.task.id)}
            reorder={getControls(node.task.id)}
            visibilityAction={getVisibilityAction(node.task)}
          />
          {node.children.length > 0 && (
            <ChildTaskRows
              tasks={node.children}
              onOpenTask={onOpenTask}
              onReorderTasks={onReorderTasks}
              getVisibilityAction={getVisibilityAction}
            />
          )}
        </Fragment>
      ))}
    </div>
  );
}

export function MilestoneSection({
  milestone,
  tasks,
  onOpenTask,
  onOpenMilestone,
  onAddTask,
  onHideTasks,
  onUnhideTask,
  onReorderTasks,
  reorder,
}: {
  milestone: Milestone | null;
  // 非表示のタスクも含めて渡す。進捗の数には非表示のタスクも数える
  tasks: Task[];
  onOpenTask: (id: string) => void;
  onOpenMilestone: (id: string) => void;
  onAddTask: (title: string) => Promise<void>;
  // 片付いたタスクを一覧から外す。未分類ではアーカイブへ移し、マイルストーン所属では非表示にする
  onHideTasks: (ids: string[]) => void;
  onUnhideTask: (id: string) => void;
  onReorderTasks: (ids: string[]) => void;
  // 未分類セクションは並び替えの対象外なので、そのときだけ渡さない
  reorder?: ReorderControls;
}) {
  const [showHidden, setShowHidden] = useState(false);
  const doneCount = tasks.filter((t) => t.status === "done").length;
  const progressPct = tasks.length === 0 ? 0 : Math.round((doneCount / tasks.length) * 100);
  const meta = milestone ? MILESTONE_STATUS_META[milestone.status] : null;
  // 未分類はマイルストーンという入れ物がないので、所属ごとアーカイブへ移して片付ける
  const isArchiveMode = milestone === null;
  const hiddenCount = tasks.filter((t) => t.hidden).length;
  const displayedTasks = showHidden ? tasks : tasks.filter((t) => !t.hidden);
  const hideableTasks = tasks.filter((t) => !t.hidden && isHideableTaskStatus(t.status));

  const getVisibilityAction: GetVisibilityAction = (task) => {
    if (task.hidden) {
      return { kind: "unhide", onClick: () => onUnhideTask(task.id) };
    }
    if (!isHideableTaskStatus(task.status)) {
      return undefined;
    }
    return { kind: isArchiveMode ? "archive" : "hide", onClick: () => onHideTasks([task.id]) };
  };

  const hideAll = () => {
    // アーカイブは所属が変わるので確認する。非表示はすぐ戻せるので確認しない
    if (
      isArchiveMode &&
      !window.confirm(
        `完了・中止の${hideableTasks.length}件をアーカイブへ移動しますか？（アーカイブからは戻せます）`,
      )
    ) {
      return;
    }
    onHideTasks(hideableTasks.map((t) => t.id));
  };

  return (
    <section
      {...reorder?.itemProps}
      className={cn(
        "group/section relative mb-8 rounded-md",
        reorder?.isDragging === true && "opacity-40",
        reorder?.isOver === true && "ring-2 ring-ring ring-offset-4 ring-offset-background",
      )}
    >
      {reorder && (
        <ReorderControlsGroup
          controls={reorder}
          direction="vertical"
          // 見出しの左の余白へ逃がして、通常時はレイアウトに影響させない
          className="absolute -left-8 top-0 opacity-0 transition-opacity group-hover/section:opacity-100 focus-within:opacity-100"
        />
      )}
      <div className="mb-2 flex items-baseline justify-between gap-3">
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
        <div className="flex flex-shrink-0 items-center gap-3">
          {hideableTasks.length > 0 && (
            <button
              type="button"
              onClick={hideAll}
              className="flex flex-shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {isArchiveMode ? <ArchiveIcon size={13} /> : <EyeOffIcon size={13} />}
              完了・中止 {hideableTasks.length} 件を{isArchiveMode ? "アーカイブ" : "非表示"}
            </button>
          )}
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowHidden((prev) => !prev)}
              aria-pressed={showHidden}
              className="flex flex-shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {showHidden ? <EyeOffIcon size={13} /> : <EyeIcon size={13} />}
              非表示 {hiddenCount} 件を{showHidden ? "隠す" : "表示"}
            </button>
          )}
          {milestone && (
            <>
              <span className="text-xs text-muted-foreground tabular-nums">
                {doneCount} / {tasks.length} 完了
              </span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground tabular-nums">{milestone.id}</span>
                <CopyIdButton id={milestone.id} />
              </div>
            </>
          )}
        </div>
      </div>
      {milestone && (
        <div className="mb-3.5 h-1 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full"
            style={{ width: `${progressPct}%`, background: "var(--status-done)" }}
          />
        </div>
      )}
      <TaskRows
        tasks={displayedTasks}
        onOpenTask={onOpenTask}
        onReorderTasks={onReorderTasks}
        getVisibilityAction={getVisibilityAction}
      />
      <AddTaskRow onAdd={onAddTask} />
    </section>
  );
}

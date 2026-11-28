import { DropdownMenu } from "radix-ui";
import { Fragment, useState } from "react";
import { type ReorderControls, useDragReorder } from "@/lib/reorder";
import { MILESTONE_STATUS_META } from "@/lib/status";
import { buildTaskTree } from "@/lib/task-tree";
import { cn } from "@/lib/utils";
import type { Milestone } from "../../milestone";
import { isHideableTaskStatus, type Task } from "../../task";
import { AddTaskRow } from "./add-task-row";
import { CopyIdButton } from "./copy-id-button";
import { ArchiveIcon, CopyIcon, EyeIcon, EyeOffIcon, MoreHorizontalIcon } from "./icons";
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

type MenuAction = { label: string; icon: React.ReactNode; onSelect: () => void };

const menuItemClass =
  "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-xs outline-none select-none data-[highlighted]:bg-muted";

/** 幅が狭いときにだけ出す、セクション見出しの操作メニュー */
function SectionMenu({
  className,
  milestone,
  progressLabel,
  hideAction,
  toggleHiddenAction,
}: {
  className?: string;
  milestone: Milestone | null;
  progressLabel: string;
  hideAction?: MenuAction;
  toggleHiddenAction?: MenuAction;
}) {
  const actions = [hideAction, toggleHiddenAction].filter((a) => a !== undefined);
  // 未分類で片付けるものがなければ、メニューに出すものがない
  if (!milestone && actions.length === 0) {
    return null;
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          title="メニュー"
          aria-label="メニュー"
          className={cn(
            "inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground data-[state=open]:bg-muted",
            className,
          )}
        >
          <MoreHorizontalIcon />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className="z-50 min-w-48 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {milestone && (
            <DropdownMenu.Label className="px-2 py-1.5 text-xs text-muted-foreground tabular-nums">
              {progressLabel}
            </DropdownMenu.Label>
          )}
          {actions.map((action) => (
            <DropdownMenu.Item
              key={action.label}
              onSelect={action.onSelect}
              className={menuItemClass}
            >
              {action.icon}
              {action.label}
            </DropdownMenu.Item>
          ))}
          {milestone && (
            <>
              {actions.length > 0 && <DropdownMenu.Separator className="my-1 h-px bg-border" />}
              <DropdownMenu.Item
                onSelect={() => void navigator.clipboard.writeText(milestone.id)}
                className={menuItemClass}
              >
                <CopyIcon size={13} />
                <span className="tabular-nums">{milestone.id} をコピー</span>
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
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
        "group/section @container relative mb-8 rounded-md",
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
      <div className="mb-2 flex items-start justify-between gap-3 @3xl:items-baseline">
        <div className="flex min-w-0 items-center gap-2.5">
          {milestone ? (
            <button
              type="button"
              onClick={() => onOpenMilestone(milestone.id)}
              className="-mx-1.5 min-w-0 cursor-pointer rounded-md px-1.5 py-0.5 text-left text-base font-semibold break-words hover:bg-muted"
            >
              {milestone.title}
            </button>
          ) : (
            <span className="text-base font-medium text-muted-foreground">未分類</span>
          )}
          {milestone && meta && (
            <span
              className="flex-shrink-0 rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold tracking-wide whitespace-nowrap uppercase"
              style={{ background: meta.bg, color: meta.fg }}
            >
              {meta.label}
            </span>
          )}
        </div>
        {/* 幅が足りないときは操作をメニューにまとめて、タイトルを折り返させない */}
        <div className="hidden flex-shrink-0 items-center gap-3 @3xl:flex">
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
        <SectionMenu
          className="@3xl:hidden"
          milestone={milestone}
          progressLabel={`${doneCount} / ${tasks.length} 完了`}
          hideAction={
            hideableTasks.length > 0
              ? {
                  label: `完了・中止 ${hideableTasks.length} 件を${isArchiveMode ? "アーカイブ" : "非表示"}`,
                  icon: isArchiveMode ? <ArchiveIcon size={13} /> : <EyeOffIcon size={13} />,
                  onSelect: hideAll,
                }
              : undefined
          }
          toggleHiddenAction={
            hiddenCount > 0
              ? {
                  label: `非表示 ${hiddenCount} 件を${showHidden ? "隠す" : "表示"}`,
                  icon: showHidden ? <EyeOffIcon size={13} /> : <EyeIcon size={13} />,
                  onSelect: () => setShowHidden((prev) => !prev),
                }
              : undefined
          }
        />
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

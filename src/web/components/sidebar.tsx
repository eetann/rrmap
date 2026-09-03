import type { ReorderControls } from "@/lib/reorder";
import type { TaskView } from "@/lib/route";
import { cn } from "@/lib/utils";
import { isArchiveMilestoneId, type Milestone } from "../../milestone";
import type { Task } from "../../task";
import { FlagIcon, ListIcon, PanelLeftIcon } from "./icons";
import { ReorderControlsGroup } from "./reorder-controls";

function MilestoneList({
  milestones,
  tasks,
  onOpenMilestone,
  getReorderControls,
}: {
  milestones: Milestone[];
  tasks: Task[];
  onOpenMilestone: (id: string) => void;
  // 非表示マイルストーンのリストは並び替えないので、そのときは渡さない
  getReorderControls?: (id: string) => ReorderControls;
}) {
  return (
    <div className="flex flex-col">
      {milestones.map((milestone) => {
        const msTasks = tasks.filter((t) => t.milestone === milestone.id);
        const doneCount = msTasks.filter((t) => t.status === "done").length;
        const reorder = getReorderControls?.(milestone.id);
        return (
          <div
            key={milestone.id}
            {...reorder?.itemProps}
            // 行が狭いのでハンドルは分けず、行のどこをつまんでもドラッグできるようにする
            {...reorder?.handleProps}
            className={cn(
              "group/milestone relative flex items-center rounded-md hover:bg-background",
              reorder?.isDragging === true && "opacity-40",
              reorder?.isOver === true && "ring-2 ring-ring",
            )}
          >
            <button
              type="button"
              onClick={() => onOpenMilestone(milestone.id)}
              className="flex min-w-0 flex-1 items-center gap-2.5 px-2.5 py-1.5 text-left"
            >
              <span
                className="block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                style={{
                  // アーカイブは中身が完了とは限らないので、完了色にはしない
                  background:
                    milestone.status === "completed" && !isArchiveMilestoneId(milestone.id)
                      ? "var(--status-done)"
                      : "var(--muted-foreground)",
                }}
              />
              <span className="min-w-0 flex-1 truncate text-xs">{milestone.title}</span>
              <span
                className={cn(
                  "text-[11px] text-muted-foreground tabular-nums",
                  reorder && "group-hover/milestone:invisible",
                )}
              >
                {doneCount}/{msTasks.length}
              </span>
            </button>
            {reorder && (
              <ReorderControlsGroup
                controls={reorder}
                direction="horizontal"
                // 幅が足りないので、ホバー中だけタイトルの上に重ねて出す
                className="absolute right-1 hidden rounded-md bg-background pl-1 group-hover/milestone:flex focus-within:flex"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function Sidebar({
  visibleMilestones,
  hiddenMilestones,
  tasks,
  view,
  onChangeView,
  onOpenMilestone,
  onToggleCollapse,
  getReorderControls,
}: {
  visibleMilestones: Milestone[];
  hiddenMilestones: Milestone[];
  tasks: Task[];
  view: TaskView;
  onChangeView: (view: TaskView) => void;
  onOpenMilestone: (id: string) => void;
  onToggleCollapse: () => void;
  getReorderControls: (id: string) => ReorderControls;
}) {
  return (
    <div className="flex w-[248px] flex-shrink-0 flex-col border-r border-border bg-muted px-5 py-7">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-lg font-bold tracking-tight">rrmap</div>
          <div className="mt-1 text-[11px] text-muted-foreground">AIと進めるロードマップ</div>
        </div>
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label="サイドバーを閉じる"
          className="-mr-1.5 flex-shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-background hover:text-foreground"
        >
          <PanelLeftIcon />
        </button>
      </div>

      <div className="mt-7 flex flex-col gap-0.5">
        <button
          type="button"
          onClick={() => onChangeView("all")}
          className={
            view === "all"
              ? "flex items-center gap-2.5 rounded-lg bg-accent px-2.5 py-2 text-[13.5px] font-semibold text-accent-foreground"
              : "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] text-muted-foreground hover:bg-background"
          }
        >
          <ListIcon />
          すべてのタスク
        </button>
        <button
          type="button"
          onClick={() => onChangeView("milestones")}
          className={
            view === "milestones"
              ? "flex items-center gap-2.5 rounded-lg bg-accent px-2.5 py-2 text-[13.5px] font-semibold text-accent-foreground"
              : "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] text-muted-foreground hover:bg-background"
          }
        >
          <FlagIcon />
          ロードマップ
        </button>
      </div>

      <div className="mt-6.5 mb-2.5 ml-2.5 text-[11px] tracking-wide text-muted-foreground uppercase">
        マイルストーン
      </div>
      <MilestoneList
        milestones={visibleMilestones}
        tasks={tasks}
        onOpenMilestone={onOpenMilestone}
        getReorderControls={getReorderControls}
      />

      {hiddenMilestones.length > 0 && (
        <>
          <div className="mt-6.5 mb-2.5 ml-2.5 text-[11px] tracking-wide text-muted-foreground uppercase">
            非表示のマイルストーン
          </div>
          <MilestoneList
            milestones={hiddenMilestones}
            tasks={tasks}
            onOpenMilestone={onOpenMilestone}
          />
        </>
      )}
    </div>
  );
}

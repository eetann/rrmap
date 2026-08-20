import type { Milestone } from "../../milestone";
import type { Task } from "../../task";
import { FlagIcon, ListIcon } from "./icons";

function MilestoneList({
  milestones,
  tasks,
  onOpenMilestone,
}: {
  milestones: Milestone[];
  tasks: Task[];
  onOpenMilestone: (id: string) => void;
}) {
  return (
    <div className="flex flex-col">
      {milestones.map((milestone) => {
        const msTasks = tasks.filter((t) => t.milestone === milestone.id);
        const doneCount = msTasks.filter((t) => t.status === "done").length;
        return (
          <button
            type="button"
            key={milestone.id}
            onClick={() => onOpenMilestone(milestone.id)}
            className="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left hover:bg-background"
          >
            <span
              className="block h-1.5 w-1.5 flex-shrink-0 rounded-full"
              style={{
                background:
                  milestone.status === "completed"
                    ? "var(--status-done)"
                    : "var(--muted-foreground)",
              }}
            />
            <span className="flex-1 truncate text-xs">{milestone.title}</span>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {doneCount}/{msTasks.length}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function Sidebar({
  visibleMilestones,
  hiddenMilestones,
  tasks,
  onOpenMilestone,
}: {
  visibleMilestones: Milestone[];
  hiddenMilestones: Milestone[];
  tasks: Task[];
  onOpenMilestone: (id: string) => void;
}) {
  return (
    <div className="flex w-[248px] flex-shrink-0 flex-col border-r border-border bg-muted px-5 py-7">
      <div className="text-lg font-bold tracking-tight">rrmap</div>
      <div className="mt-1 text-[11px] text-muted-foreground">AIと進めるロードマップ</div>

      <div className="mt-7 flex flex-col gap-0.5">
        <div className="flex items-center gap-2.5 rounded-lg bg-accent px-2.5 py-2 text-[13.5px] font-semibold text-accent-foreground">
          <ListIcon />
          すべてのタスク
        </div>
        <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] text-muted-foreground">
          <FlagIcon />
          マイルストーン
        </div>
      </div>

      <div className="mt-6.5 mb-2.5 ml-2.5 text-[11px] tracking-wide text-muted-foreground uppercase">
        マイルストーン
      </div>
      <MilestoneList
        milestones={visibleMilestones}
        tasks={tasks}
        onOpenMilestone={onOpenMilestone}
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

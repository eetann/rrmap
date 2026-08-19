import type { MilestoneStatus } from "../../milestone";
import type { TaskStatus } from "../../task";

export interface TaskStatusMeta {
  label: string;
  dot: string;
  bg: string;
  fg: string;
}

export const TASK_STATUS_META: Record<TaskStatus, TaskStatusMeta> = {
  draft: {
    label: "下書き",
    dot: "var(--status-draft)",
    bg: "var(--status-draft-bg)",
    fg: "var(--status-draft-fg)",
  },
  refined: {
    label: "精査済み",
    dot: "var(--status-refined)",
    bg: "var(--status-refined-bg)",
    fg: "var(--status-refined-fg)",
  },
  in_progress: {
    label: "進行中",
    dot: "var(--status-in_progress)",
    bg: "var(--status-in_progress-bg)",
    fg: "var(--status-in_progress-fg)",
  },
  done: {
    label: "完了",
    dot: "var(--status-done)",
    bg: "var(--status-done-bg)",
    fg: "var(--status-done-fg)",
  },
  cancelled: {
    label: "中止",
    dot: "var(--status-cancelled)",
    bg: "var(--status-cancelled-bg)",
    fg: "var(--status-cancelled-fg)",
  },
};

export const TASK_STATUS_OPTIONS: TaskStatus[] = [
  "draft",
  "refined",
  "in_progress",
  "done",
  "cancelled",
];

export interface MilestoneStatusMeta {
  label: string;
  bg: string;
  fg: string;
}

export const MILESTONE_STATUS_META: Record<MilestoneStatus, MilestoneStatusMeta> = {
  planned: {
    label: "planned",
    bg: "var(--status-draft-bg)",
    fg: "var(--status-draft-fg)",
  },
  active: {
    label: "active",
    bg: "var(--accent)",
    fg: "var(--accent-foreground)",
  },
  completed: {
    label: "completed",
    bg: "var(--status-done-bg)",
    fg: "var(--status-done-fg)",
  },
};

export const MILESTONE_STATUS_OPTIONS: MilestoneStatus[] = ["planned", "active", "completed"];

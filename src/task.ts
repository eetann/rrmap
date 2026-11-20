import matter from "gray-matter";
import { isMilestoneId } from "./milestone";

export const TASK_STATUSES = ["draft", "refined", "in_progress", "done", "cancelled"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

// 片付いたとみなせるステータス。これらのタスクだけ一覧から非表示にできる
export const HIDEABLE_TASK_STATUSES: readonly TaskStatus[] = ["done", "cancelled"];

export function isHideableTaskStatus(status: TaskStatus): boolean {
  return HIDEABLE_TASK_STATUSES.includes(status);
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  parent: string | null;
  milestone: string | null;
  // Web UIのマイルストーンビューから外す。所属はそのままなので進捗の数には含まれる
  hidden: boolean;
  body: string;
}

const TASK_ID_PATTERN = /^TASK-(\d{4,})$/;

export function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === "string" && (TASK_STATUSES as readonly string[]).includes(value);
}

export function isTaskId(value: unknown): value is string {
  return typeof value === "string" && TASK_ID_PATTERN.test(value);
}

export function taskIdFromNumber(n: number): string {
  return `TASK-${String(n).padStart(4, "0")}`;
}

export function taskIdNumber(id: string): number {
  const match = TASK_ID_PATTERN.exec(id);
  if (!match) {
    throw new Error(`invalid task id: ${id}`);
  }
  return Number(match[1]);
}

export function taskFileName(id: string): string {
  return `${id}.md`;
}

export function parseTask(raw: string): Task {
  const { data, content } = matter(raw);

  if (!isTaskId(data.id)) {
    throw new Error(`invalid task frontmatter: "id" must match TASK-NNNN`);
  }
  if (typeof data.title !== "string" || data.title.trim() === "") {
    throw new Error(`invalid task frontmatter: "title" must be a non-empty string`);
  }
  if (!isTaskStatus(data.status)) {
    throw new Error(
      `invalid task frontmatter: "status" must be one of ${TASK_STATUSES.join(", ")}`,
    );
  }
  if (data.parent !== null && data.parent !== undefined && !isTaskId(data.parent)) {
    throw new Error(`invalid task frontmatter: "parent" must be a task id or null`);
  }
  if (data.milestone !== null && data.milestone !== undefined && !isMilestoneId(data.milestone)) {
    throw new Error(`invalid task frontmatter: "milestone" must be a milestone id or null`);
  }
  if (data.hidden !== undefined && typeof data.hidden !== "boolean") {
    throw new Error(`invalid task frontmatter: "hidden" must be a boolean`);
  }

  return {
    id: data.id,
    title: data.title,
    status: data.status,
    parent: data.parent ?? null,
    milestone: data.milestone ?? null,
    hidden: data.hidden ?? false,
    body: content.replace(/^\n+/, "").replace(/\n+$/, ""),
  };
}

export function stringifyTask(task: Task): string {
  return matter.stringify(`${task.body}\n`, {
    id: task.id,
    title: task.title,
    status: task.status,
    parent: task.parent,
    milestone: task.milestone,
    // ほとんどのタスクはfalseなので、全ファイルに1行増えないよう省く
    ...(task.hidden ? { hidden: true } : {}),
  });
}

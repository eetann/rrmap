import matter from "gray-matter";
import { isMilestoneId } from "./milestone";

export const TASK_STATUSES = ["draft", "refined", "in_progress", "done", "cancelled"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  parent: string | null;
  milestone: string | null;
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

  return {
    id: data.id,
    title: data.title,
    status: data.status,
    parent: data.parent ?? null,
    milestone: data.milestone ?? null,
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
  });
}

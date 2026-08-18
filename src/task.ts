import matter from "gray-matter";

export const TASK_STATUSES = [
  "draft",
  "refined",
  "in_progress",
  "done",
  "cancelled",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  parent: number | null;
  body: string;
}

export function isTaskStatus(value: unknown): value is TaskStatus {
  return (
    typeof value === "string" &&
    (TASK_STATUSES as readonly string[]).includes(value)
  );
}

export function taskFileName(id: number): string {
  return `${id}.md`;
}

export function parseTask(raw: string): Task {
  const { data, content } = matter(raw);

  if (typeof data.id !== "number" || !Number.isInteger(data.id)) {
    throw new Error(`invalid task frontmatter: "id" must be an integer`);
  }
  if (typeof data.title !== "string" || data.title.trim() === "") {
    throw new Error(`invalid task frontmatter: "title" must be a non-empty string`);
  }
  if (!isTaskStatus(data.status)) {
    throw new Error(
      `invalid task frontmatter: "status" must be one of ${TASK_STATUSES.join(", ")}`,
    );
  }
  if (
    data.parent !== null &&
    data.parent !== undefined &&
    (typeof data.parent !== "number" || !Number.isInteger(data.parent))
  ) {
    throw new Error(`invalid task frontmatter: "parent" must be an integer or null`);
  }

  return {
    id: data.id,
    title: data.title,
    status: data.status,
    parent: data.parent ?? null,
    body: content.replace(/^\n+/, "").replace(/\n+$/, ""),
  };
}

export function stringifyTask(task: Task): string {
  return matter.stringify(`${task.body}\n`, {
    id: task.id,
    title: task.title,
    status: task.status,
    parent: task.parent,
  });
}

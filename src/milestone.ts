import matter from "gray-matter";

export const MILESTONE_STATUSES = ["planned", "active", "completed"] as const;

export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export interface Milestone {
  id: string;
  title: string;
  status: MilestoneStatus;
  body: string;
}

const MILESTONE_ID_PATTERN = /^MILESTONE-(\d{4,})$/;

export function isMilestoneStatus(value: unknown): value is MilestoneStatus {
  return typeof value === "string" && (MILESTONE_STATUSES as readonly string[]).includes(value);
}

export function isMilestoneId(value: unknown): value is string {
  return typeof value === "string" && MILESTONE_ID_PATTERN.test(value);
}

export function milestoneIdFromNumber(n: number): string {
  return `MILESTONE-${String(n).padStart(4, "0")}`;
}

export function milestoneIdNumber(id: string): number {
  const match = MILESTONE_ID_PATTERN.exec(id);
  if (!match) {
    throw new Error(`invalid milestone id: ${id}`);
  }
  return Number(match[1]);
}

export function milestoneFileName(id: string): string {
  return `${id}.md`;
}

export function parseMilestone(raw: string): Milestone {
  const { data, content } = matter(raw);

  if (!isMilestoneId(data.id)) {
    throw new Error(`invalid milestone frontmatter: "id" must match MILESTONE-NNNN`);
  }
  if (typeof data.title !== "string" || data.title.trim() === "") {
    throw new Error(`invalid milestone frontmatter: "title" must be a non-empty string`);
  }
  if (!isMilestoneStatus(data.status)) {
    throw new Error(
      `invalid milestone frontmatter: "status" must be one of ${MILESTONE_STATUSES.join(", ")}`,
    );
  }

  return {
    id: data.id,
    title: data.title,
    status: data.status,
    body: content.replace(/^\n+/, "").replace(/\n+$/, ""),
  };
}

export function stringifyMilestone(milestone: Milestone): string {
  return matter.stringify(`${milestone.body}\n`, {
    id: milestone.id,
    title: milestone.title,
    status: milestone.status,
  });
}

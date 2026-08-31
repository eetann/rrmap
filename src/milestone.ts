import matter from "gray-matter";

export const MILESTONE_STATUSES = ["planned", "active", "completed"] as const;

export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export interface Milestone {
  id: string;
  title: string;
  status: MilestoneStatus;
  hidden: boolean;
  body: string;
}

const MILESTONE_ID_PATTERN = /^MILESTONE-(\d{4,})$/;

/**
 * ファイルを持たない組み込みマイルストーン。
 * 未分類やほかのマイルストーンから「片付けておきたい」タスクの置き場として使う。
 * 実体がないので、タイトル・ステータス・本文は編集できない。
 */
export const ARCHIVE_MILESTONE_ID = "MILESTONE-ARCHIVED";

const ARCHIVE_MILESTONE_TITLE = "アーカイブ";

export function isArchiveMilestoneId(value: unknown): value is typeof ARCHIVE_MILESTONE_ID {
  return value === ARCHIVE_MILESTONE_ID;
}

export function createArchiveMilestone(): Milestone {
  return {
    id: ARCHIVE_MILESTONE_ID,
    title: ARCHIVE_MILESTONE_TITLE,
    status: "completed",
    // 非表示マイルストーンと同じ扱い。タスク一覧には出さず、サイドバーから開く
    hidden: true,
    body: "",
  };
}

export function isMilestoneStatus(value: unknown): value is MilestoneStatus {
  return typeof value === "string" && (MILESTONE_STATUSES as readonly string[]).includes(value);
}

export function isMilestoneId(value: unknown): value is string {
  return (
    isArchiveMilestoneId(value) || (typeof value === "string" && MILESTONE_ID_PATTERN.test(value))
  );
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
  if (isArchiveMilestoneId(data.id)) {
    throw new Error(
      `invalid milestone frontmatter: "${ARCHIVE_MILESTONE_ID}" is built-in and cannot be a file`,
    );
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
    hidden: data.hidden === true,
    body: content.replace(/^\n+/, "").replace(/\n+$/, ""),
  };
}

export function stringifyMilestone(milestone: Milestone): string {
  return matter.stringify(`${milestone.body}\n`, {
    id: milestone.id,
    title: milestone.title,
    status: milestone.status,
    hidden: milestone.hidden,
  });
}

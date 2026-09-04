import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  ARCHIVE_MILESTONE_ID,
  createArchiveMilestone,
  isArchiveMilestoneId,
  type Milestone,
  milestoneFileName,
  parseMilestone,
  stringifyMilestone,
} from "./milestone";
import { sortMilestonesByOrder } from "./milestone-order";
import { applyPartialOrder, ORDER_FILE_NAME, parseOrder, stringifyOrder } from "./order";

export function resolveMilestonesDir(baseDir: string = process.cwd()): string {
  return join(baseDir, ".rrmap", "milestones");
}

async function listMilestoneFiles(milestonesDir: string): Promise<string[]> {
  let entries: string[];
  try {
    entries = await readdir(milestonesDir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
  return entries.filter((entry) => entry.endsWith(".md"));
}

export function resolveMilestoneOrderPath(milestonesDir: string): string {
  return join(milestonesDir, ORDER_FILE_NAME);
}

export async function readMilestoneOrder(milestonesDir: string): Promise<string[]> {
  let raw: string;
  try {
    raw = await readFile(resolveMilestoneOrderPath(milestonesDir), "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
  try {
    return parseOrder(raw);
  } catch {
    // 手で壊されたJSONで一覧ごと読めなくならないよう、並び順だけ諦めてid順に戻す
    return [];
  }
}

export async function writeMilestoneOrder(milestonesDir: string, ids: string[]): Promise<void> {
  await mkdir(milestonesDir, { recursive: true });
  await writeFile(
    resolveMilestoneOrderPath(milestonesDir),
    // 組み込みのアーカイブは並び替えの対象外なので、順序ファイルにも残さない
    stringifyOrder(ids.filter((id) => !isArchiveMilestoneId(id))),
    "utf8",
  );
}

export async function listMilestones(milestonesDir: string): Promise<Milestone[]> {
  const files = await listMilestoneFiles(milestonesDir);
  const milestones = await Promise.all(
    files.map(async (file) => {
      const raw = await readFile(join(milestonesDir, file), "utf8");
      return parseMilestone(raw);
    }),
  );
  const order = await readMilestoneOrder(milestonesDir);
  // 組み込みのアーカイブはファイルを持たないので、並び順によらず常に末尾に置く
  return sortMilestonesByOrder([...milestones, createArchiveMilestone()], order);
}

/**
 * 一覧に出ているマイルストーンだけを並び替えた結果を受け取り、order.jsonへ保存する。
 * 渡されなかったマイルストーン（非表示のものなど）の位置は動かさない。
 */
export async function reorderMilestones(
  milestonesDir: string,
  reorderedIds: string[],
): Promise<Milestone[]> {
  const milestones = await listMilestones(milestonesDir);
  const fullIds = milestones
    .filter((milestone) => !isArchiveMilestoneId(milestone.id))
    .map((milestone) => milestone.id);
  const nextOrder = applyPartialOrder(fullIds, reorderedIds);
  await writeMilestoneOrder(milestonesDir, nextOrder);
  return sortMilestonesByOrder(milestones, nextOrder);
}

export async function readMilestone(milestonesDir: string, id: string): Promise<Milestone> {
  if (isArchiveMilestoneId(id)) {
    return createArchiveMilestone();
  }

  const filePath = join(milestonesDir, milestoneFileName(id));
  let raw: string;
  try {
    raw = await readFile(filePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`milestone not found: ${id}`);
    }
    throw error;
  }
  return parseMilestone(raw);
}

export async function writeMilestone(milestonesDir: string, milestone: Milestone): Promise<void> {
  if (isArchiveMilestoneId(milestone.id)) {
    throw new Error(`${ARCHIVE_MILESTONE_ID} is a built-in milestone and cannot be edited`);
  }

  await mkdir(milestonesDir, { recursive: true });
  const filePath = join(milestonesDir, milestoneFileName(milestone.id));
  await writeFile(filePath, stringifyMilestone(milestone), "utf8");
}

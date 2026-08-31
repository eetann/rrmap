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

export async function listMilestones(milestonesDir: string): Promise<Milestone[]> {
  const files = await listMilestoneFiles(milestonesDir);
  const milestones = await Promise.all(
    files.map(async (file) => {
      const raw = await readFile(join(milestonesDir, file), "utf8");
      return parseMilestone(raw);
    }),
  );
  milestones.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  // 組み込みのアーカイブはファイルを持たないので、採番順には並べず常に末尾に置く
  return [...milestones, createArchiveMilestone()];
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

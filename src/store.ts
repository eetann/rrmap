import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseTask, stringifyTask, taskFileName, type Task } from "./task.ts";

export function resolveTasksDir(baseDir: string = process.cwd()): string {
  return join(baseDir, ".rrmap", "tasks");
}

async function listTaskFiles(tasksDir: string): Promise<string[]> {
  let entries: string[];
  try {
    entries = await readdir(tasksDir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw error;
  }
  return entries.filter((entry) => entry.endsWith(".md"));
}

export async function listTasks(tasksDir: string): Promise<Task[]> {
  const files = await listTaskFiles(tasksDir);
  const tasks = await Promise.all(
    files.map(async (file) => {
      const raw = await readFile(join(tasksDir, file), "utf8");
      return parseTask(raw);
    }),
  );
  return tasks.sort((a, b) => a.id - b.id);
}

export async function readTask(tasksDir: string, id: number): Promise<Task> {
  const filePath = join(tasksDir, taskFileName(id));
  let raw: string;
  try {
    raw = await readFile(filePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`task not found: ${id}`);
    }
    throw error;
  }
  return parseTask(raw);
}

export async function writeTask(tasksDir: string, task: Task): Promise<void> {
  await mkdir(tasksDir, { recursive: true });
  const filePath = join(tasksDir, taskFileName(task.id));
  await writeFile(filePath, stringifyTask(task), "utf8");
}

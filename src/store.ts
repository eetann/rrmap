import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { applyPartialOrder, ORDER_FILE_NAME, parseOrder, stringifyOrder } from "./order";
import { parseTask, stringifyTask, taskFileName, type Task } from "./task";
import { sortTasksByOrder } from "./task-order";

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

export function resolveTaskOrderPath(tasksDir: string): string {
  return join(tasksDir, ORDER_FILE_NAME);
}

export async function readTaskOrder(tasksDir: string): Promise<string[]> {
  let raw: string;
  try {
    raw = await readFile(resolveTaskOrderPath(tasksDir), "utf8");
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

export async function writeTaskOrder(tasksDir: string, ids: string[]): Promise<void> {
  await mkdir(tasksDir, { recursive: true });
  await writeFile(resolveTaskOrderPath(tasksDir), stringifyOrder(ids), "utf8");
}

export async function listTasks(tasksDir: string): Promise<Task[]> {
  const files = await listTaskFiles(tasksDir);
  const tasks = await Promise.all(
    files.map(async (file) => {
      const raw = await readFile(join(tasksDir, file), "utf8");
      return parseTask(raw);
    }),
  );
  const order = await readTaskOrder(tasksDir);
  return sortTasksByOrder(tasks, order);
}

/**
 * 一覧に出ているタスクだけを並び替えた結果を受け取り、order.jsonへ保存する。
 * 渡されなかったタスク（他のマイルストーンや検索から外れたものなど）の位置は動かさない。
 */
export async function reorderTasks(tasksDir: string, reorderedIds: string[]): Promise<Task[]> {
  const tasks = await listTasks(tasksDir);
  const nextOrder = applyPartialOrder(
    tasks.map((task) => task.id),
    reorderedIds,
  );
  await writeTaskOrder(tasksDir, nextOrder);
  return sortTasksByOrder(tasks, nextOrder);
}

export async function readTask(tasksDir: string, id: string): Promise<Task> {
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

export async function deleteTask(tasksDir: string, id: string): Promise<void> {
  const filePath = join(tasksDir, taskFileName(id));
  try {
    await unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`task not found: ${id}`);
    }
    throw error;
  }
}

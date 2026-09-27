import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { commitRrmapChanges } from "./commit-git";

const execFileAsync = promisify(execFile);

describe("commitRrmapChanges", () => {
  let dir: string;

  async function git(...args: string[]): Promise<string> {
    const { stdout } = await execFileAsync("git", args, { cwd: dir });
    return stdout;
  }

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "rrmap-commit-git-test-"));
    await git("init");
    await git("config", "user.email", "test@example.com");
    await git("config", "user.name", "rrmap test");
    // 実行環境の署名設定に引きずられてコミットが失敗しないようにする
    await git("config", "commit.gpgsign", "false");
    await mkdir(join(dir, ".rrmap", "tasks"), { recursive: true });
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  test("reports nothing to commit when .rrmap has no change", async () => {
    const outcome = await commitRrmapChanges({ cwd: dir });
    expect(outcome).toEqual({ committed: false, message: null, fileCount: 0 });
  });

  test("commits .rrmap changes and leaves other files alone", async () => {
    await writeFile(join(dir, ".rrmap", "tasks", "TASK-0001.md"), "# task\n");
    await writeFile(join(dir, "outside.md"), "# outside\n");

    const outcome = await commitRrmapChanges({ cwd: dir });
    expect(outcome).toEqual({
      committed: true,
      message: "chore(rrmap): add TASK-0001",
      fileCount: 1,
    });

    const committedFiles = (await git("show", "--pretty=format:", "--name-only", "HEAD")).trim();
    expect(committedFiles).toBe(".rrmap/tasks/TASK-0001.md");
    // .rrmap以外はステージもされないまま残る
    expect(await git("status", "--porcelain")).toBe("?? outside.md\n");
  });

  test("uses the given message instead of building one", async () => {
    await writeFile(join(dir, ".rrmap", "tasks", "TASK-0001.md"), "# task\n");

    const outcome = await commitRrmapChanges({ cwd: dir, message: "任意のメッセージ" });
    expect(outcome.message).toBe("任意のメッセージ");
    expect((await git("log", "-1", "--pretty=format:%s")).trim()).toBe("任意のメッセージ");
  });

  test("throws when .rrmap is missing", async () => {
    await rm(join(dir, ".rrmap"), { recursive: true });
    expect(commitRrmapChanges({ cwd: dir })).rejects.toThrow(".rrmap not found");
  });
});

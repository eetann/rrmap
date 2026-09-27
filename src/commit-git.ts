/**
 * `.rrmap`配下の変更だけをコミットする一連のgit操作。CLIの`rrmap commit`とWeb UIの
 * コミットボタンから同じ手順で呼ぶため、結果は標準出力ではなく値で返す。
 * コミットメッセージの組み立てはcommit.tsが持つ。
 */
import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";
import { buildCommitMessage, hasChanges, parseGitStatus, RRMAP_DIR_NAME } from "./commit";

const execFileAsync = promisify(execFile);

export interface CommitOutcome {
  /** コミットする変更が無かったときはfalse。異常ではないので例外にはしない */
  committed: boolean;
  message: string | null;
  fileCount: number;
}

async function git(args: string[], cwd: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", args, { cwd });
    return stdout;
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr?.trim();
    throw new Error(stderr ? stderr : (error as Error).message);
  }
}

export async function commitRrmapChanges(
  options: { message?: string; cwd?: string } = {},
): Promise<CommitOutcome> {
  const cwd = options.cwd ?? process.cwd();
  if (!existsSync(join(cwd, RRMAP_DIR_NAME))) {
    throw new Error(`${RRMAP_DIR_NAME} not found in ${cwd}`);
  }
  await git(["rev-parse", "--git-dir"], cwd);

  // --no-renamesで、リネーム時に元パスが続く形を避けて1エントリ1パスに固定する
  const status = parseGitStatus(
    await git(
      [
        "status",
        "--porcelain",
        "-z",
        "--untracked-files=all",
        "--no-renames",
        "--",
        RRMAP_DIR_NAME,
      ],
      cwd,
    ),
  );
  if (!hasChanges(status)) {
    return { committed: false, message: null, fileCount: 0 };
  }

  const message = options.message ?? buildCommitMessage(status);
  const fileCount = status.changes.length + status.reordered.length + status.others.length;

  // addで未追跡ファイルを拾い、commitのpathspecで.rrmap以外のステージ済み変更を締め出す
  await git(["add", "-A", "--", RRMAP_DIR_NAME], cwd);
  await git(["commit", "-m", message, "--", RRMAP_DIR_NAME], cwd);

  return { committed: true, message, fileCount };
}

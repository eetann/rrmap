import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { promisify } from "node:util";
import { define } from "gunshi";
import { buildCommitMessage, hasChanges, parseGitStatus, RRMAP_DIR_NAME } from "../commit";

const execFileAsync = promisify(execFile);

async function git(args: string[]): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", args, { cwd: process.cwd() });
    return stdout;
  } catch (error) {
    const stderr = (error as { stderr?: string }).stderr?.trim();
    throw new Error(stderr ? stderr : (error as Error).message);
  }
}

export const commitCommand = define({
  name: "commit",
  description: ".rrmap配下の変更だけをまとめてコミットする",
  examples: `$ rrmap commit
$ rrmap commit -m "任意のコミットメッセージ"

タスク・マイルストーンの追加・編集・並び替えをひとまとめにコミットする。ステージもコミットも
.rrmap配下に限定するので、ほかに編集中のファイルやステージ済みの変更があっても巻き込まない。
メッセージは変更内容から組み立てる（例: \`chore(rrmap): add TASK-0042, update 3 tasks\`）。`,
  args: {
    message: {
      type: "string",
      short: "m",
      description: "コミットメッセージを指定する（未指定時は変更内容から組み立てる）",
    },
  },
  run: async (ctx) => {
    if (!existsSync(join(process.cwd(), RRMAP_DIR_NAME))) {
      throw new Error(`${RRMAP_DIR_NAME} not found in ${process.cwd()}`);
    }
    await git(["rev-parse", "--git-dir"]);

    // --no-renamesで、リネーム時に元パスが続く形を避けて1エントリ1パスに固定する
    const status = parseGitStatus(
      await git([
        "status",
        "--porcelain",
        "-z",
        "--untracked-files=all",
        "--no-renames",
        "--",
        RRMAP_DIR_NAME,
      ]),
    );
    if (!hasChanges(status)) {
      console.log(`nothing to commit under ${RRMAP_DIR_NAME}`);
      return;
    }

    const message = ctx.values.message ?? buildCommitMessage(status);
    const fileCount = status.changes.length + status.reordered.length + status.others.length;

    // addで未追跡ファイルを拾い、commitのpathspecで.rrmap以外のステージ済み変更を締め出す
    await git(["add", "-A", "--", RRMAP_DIR_NAME]);
    await git(["commit", "-m", message, "--", RRMAP_DIR_NAME]);

    console.log(`committed ${fileCount} file(s): ${message}`);
  },
});

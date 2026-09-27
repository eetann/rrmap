import { define } from "gunshi";
import { RRMAP_DIR_NAME } from "../commit";
import { commitRrmapChanges } from "../commit-git";

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
    const outcome = await commitRrmapChanges({ message: ctx.values.message });
    if (!outcome.committed) {
      console.log(`nothing to commit under ${RRMAP_DIR_NAME}`);
      return;
    }
    console.log(`committed ${outcome.fileCount} file(s): ${outcome.message}`);
  },
});

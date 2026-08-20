import { define } from "gunshi";
import { MILESTONE_STATUSES } from "../milestone";
import { TASK_STATUSES } from "../task";

export const formatCommand = define({
  name: "format",
  description: "タスク・マイルストーンのMarkdownフォーマットを表示する",
  run: async () => {
    console.log(`タスク・マイルストーンは.rrmap/tasks/・.rrmap/milestones/配下のMarkdownファイルとして保存される。
以下のフォーマットに従っていれば、CLIを経由せず直接編集・作成してよい。

# タスク（.rrmap/tasks/TASK-XXXX.md）

---
id: TASK-0001
title: タスクのタイトル
status: draft              # ${TASK_STATUSES.join(" | ")}
parent: null                # 親タスクid（TASK-XXXX形式）。トップレベルなら null。親子関係は1階層のみ
milestone: null             # 所属マイルストーンid（MILESTONE-XXXX形式）。どこにも属さなければ null
---

本文は自由なMarkdown。テンプレートは強制しないが、「何をするか」「現在の状態」「方針・意思決定」に
触れておくと後から見返しやすい。

# マイルストーン（.rrmap/milestones/MILESTONE-XXXX.md）

---
id: MILESTONE-0001
title: マイルストーンのタイトル
status: planned              # ${MILESTONE_STATUSES.join(" | ")}
hidden: false                # trueにするとWeb UIのタスク一覧から非表示（サイドバーの「非表示のマイルストーン」からは開ける）
---

本文は自由なMarkdown。目的・スコープなど残しておきたいことを書く。`);
  },
});

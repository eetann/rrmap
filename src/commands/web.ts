import { existsSync } from "node:fs";
import { define } from "gunshi";
import { getWebDistDir } from "../paths";

export const webCommand = define({
  name: "web",
  description: "Web UIを起動する",
  args: {
    port: {
      type: "number",
      short: "p",
      description: "ポート番号を指定する（未指定時は空きポートを自動選択）",
    },
  },
  examples: `$ rrmap web
$ rrmap web --port 4000

管理したいプロジェクトのルートで実行する。ブラウザで表示されたURL（未指定時は空きポートを自動選択）
を開くと、タスク・マイルストーンの一覧・詳細編集ができる。`,
  run: async (ctx) => {
    const distDir = getWebDistDir();
    if (!existsSync(distDir)) {
      console.error(
        "Web UIのビルド成果物が見つかりません。`bun run build:web`を実行してください。",
      );
      process.exitCode = 1;
      return;
    }

    const { startServer } = await import("../web/server.ts");
    startServer(ctx.values.port);
  },
});

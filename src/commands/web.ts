import { existsSync } from "node:fs";
import { define } from "gunshi";
import { getWebDistDir } from "../paths";

export const webCommand = define({
  name: "web",
  description: "Web UIを起動する",
  examples: `$ rrmap web

管理したいプロジェクトのルートで実行する。ブラウザで表示されたURL（デフォルトは http://localhost:3000 ）
を開くと、タスク・マイルストーンの一覧・詳細編集ができる。`,
  run: async () => {
    const distDir = getWebDistDir();
    if (!existsSync(distDir)) {
      console.error(
        "Web UIのビルド成果物が見つかりません。`bun run build:web`を実行してください。",
      );
      process.exitCode = 1;
      return;
    }

    await import("../web/server.ts");
  },
});

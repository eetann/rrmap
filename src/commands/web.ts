import { existsSync } from "node:fs";
import path from "node:path";
import { define } from "gunshi";

export const webCommand = define({
  name: "web",
  description: "Web UIを起動する",
  examples: `$ rrmap web

管理したいプロジェクトのルートで実行する。ブラウザで表示されたURL（デフォルトは http://localhost:3000 ）
を開くと、タスク・マイルストーンの一覧・詳細編集ができる。`,
  run: async () => {
    const rrmapRoot = path.resolve(import.meta.dirname, "..", "..");
    const distDir = path.join(rrmapRoot, "dist", "web");
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

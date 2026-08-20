import { spawn } from "node:child_process";
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
    const bunfigPath = path.join(rrmapRoot, "bunfig.toml");
    const serverPath = path.join(rrmapRoot, "src", "web", "server.ts");

    const exitCode = await new Promise<number>((resolve, reject) => {
      const child = spawn("bun", [`--config=${bunfigPath}`, serverPath], {
        stdio: "inherit",
      });
      child.on("error", reject);
      child.on("exit", (code) => resolve(code ?? 0));
    });

    process.exitCode = exitCode;
  },
});

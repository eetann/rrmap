import { existsSync } from "node:fs";
import path from "node:path";

export function findPackageRoot(startDir: string): string {
  let dir = startDir;
  for (;;) {
    if (existsSync(path.join(dir, "package.json"))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      throw new Error(`package.jsonが見つかりませんでした（探索開始: ${startDir}）`);
    }
    dir = parent;
  }
}

export function getRrmapRoot(): string {
  return findPackageRoot(import.meta.dirname);
}

export function getWebDistDir(): string {
  return path.join(getRrmapRoot(), "dist", "web");
}

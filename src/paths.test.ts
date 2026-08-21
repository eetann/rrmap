import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findPackageRoot } from "./paths";

describe("findPackageRoot", () => {
  let dir: string;
  let pkgRoot: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "rrmap-paths-test-"));
    pkgRoot = join(dir, "pkg");
    await mkdir(pkgRoot, { recursive: true });
    await writeFile(join(pkgRoot, "package.json"), "{}");
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  test("ネストしたディレクトリから package.json のあるルートを見つける", async () => {
    const nested = join(pkgRoot, "dist", "nested");
    await mkdir(nested, { recursive: true });

    expect(findPackageRoot(nested)).toBe(pkgRoot);
    expect(findPackageRoot(join(pkgRoot, "dist"))).toBe(pkgRoot);
    expect(findPackageRoot(join(pkgRoot, "src"))).toBe(pkgRoot);
  });

  test("package.json が見つからない場合はエラーを投げる", () => {
    expect(() => findPackageRoot(dir)).toThrow();
  });
});

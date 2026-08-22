import { describe, expect, test } from "bun:test";
import { isWsl, resolveOpenCommand } from "./open-browser";

describe("isWsl", () => {
  test("WSLのカーネルリリース文字列を検出する", () => {
    expect(isWsl("linux", "5.15.90.1-microsoft-standard-WSL2")).toBe(true);
  });

  test("通常のLinuxはWSLと判定しない", () => {
    expect(isWsl("linux", "6.1.0-generic")).toBe(false);
  });

  test("linux以外のプラットフォームはWSLと判定しない", () => {
    expect(isWsl("darwin", "5.15.90.1-microsoft-standard-WSL2")).toBe(false);
  });
});

describe("resolveOpenCommand", () => {
  const url = "http://localhost:3000";

  test("macOSはopenコマンドを使う", () => {
    expect(resolveOpenCommand(url, "darwin", "23.0.0")).toEqual({
      command: "open",
      args: [url],
    });
  });

  test("Windowsはcmd /c startを使う", () => {
    expect(resolveOpenCommand(url, "win32", "10.0.0")).toEqual({
      command: "cmd",
      args: ["/c", "start", "", url],
    });
  });

  test("WSLはWindows側のcmd.exeを使う", () => {
    expect(resolveOpenCommand(url, "linux", "5.15.90.1-microsoft-standard-WSL2")).toEqual({
      command: "cmd.exe",
      args: ["/c", "start", "", url],
    });
  });

  test("通常のLinuxはxdg-openを使う", () => {
    expect(resolveOpenCommand(url, "linux", "6.1.0-generic")).toEqual({
      command: "xdg-open",
      args: [url],
    });
  });
});

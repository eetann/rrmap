import { spawn } from "node:child_process";
import { release } from "node:os";

export type OpenCommand = { command: string; args: string[] };

/**
 * WSL上では process.platform が "linux" になるため、Windows側のブラウザで
 * 開くにはカーネルのリリース文字列（例: "...-microsoft-standard-WSL2"）で判定する。
 */
export function isWsl(platform: NodeJS.Platform, releaseName: string): boolean {
  return platform === "linux" && releaseName.toLowerCase().includes("microsoft");
}

export function resolveOpenCommand(
  url: string,
  platform: NodeJS.Platform,
  releaseName: string,
): OpenCommand {
  if (platform === "darwin") {
    return { command: "open", args: [url] };
  }
  if (platform === "win32") {
    return { command: "cmd", args: ["/c", "start", "", url] };
  }
  if (isWsl(platform, releaseName)) {
    return { command: "cmd.exe", args: ["/c", "start", "", url] };
  }
  return { command: "xdg-open", args: [url] };
}

export function openBrowser(url: string): void {
  const { command, args } = resolveOpenCommand(url, process.platform, release());
  const child = spawn(command, args, { stdio: "ignore", detached: true });
  child.on("error", (error) => {
    console.error(`ブラウザを自動で開けませんでした: ${error.message}`);
  });
  child.unref();
}

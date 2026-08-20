import { type FSWatcher, watch } from "node:fs";

export type FileWatcher = {
  onChange: (listener: () => void) => () => void;
  close: () => void;
};

export function createFileWatcher(dirs: string[], debounceMs = 300): FileWatcher {
  const listeners = new Set<() => void>();
  let timer: ReturnType<typeof setTimeout> | null = null;

  const scheduleNotify = () => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = null;
      for (const listener of listeners) {
        listener();
      }
    }, debounceMs);
  };

  const watchers: FSWatcher[] = [];
  for (const dir of dirs) {
    try {
      watchers.push(watch(dir, scheduleNotify));
    } catch {
      // ディレクトリが存在しない場合は監視をスキップする
    }
  }

  return {
    onChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    close() {
      if (timer) {
        clearTimeout(timer);
      }
      for (const watcher of watchers) {
        watcher.close();
      }
    },
  };
}

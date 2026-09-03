import { useCallback, useEffect, useState } from "react";

// サイドバー(248px)とサイドピーク(480px)を同時に開いても一覧が潰れない幅を境界にする
const NARROW_QUERY = "(max-width: 1023px)";
const STORAGE_KEY = "rrmap:sidebar-collapsed";

type SavedState = { collapsed: boolean; narrow: boolean };

function readSavedState(): SavedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<SavedState>;
    if (typeof parsed.collapsed !== "boolean" || typeof parsed.narrow !== "boolean") {
      return null;
    }
    return { collapsed: parsed.collapsed, narrow: parsed.narrow };
  } catch {
    return null;
  }
}

function saveState(state: SavedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // プライベートモードなどで保存できなくても、開閉自体は動くので無視する
  }
}

/**
 * サイドバーの折り畳み状態。狭い幅では折り畳みを既定にしつつ、手動の開閉はリロードしても維持する。
 * 保存時と幅の広い/狭いが変わっていたときだけ、その幅での既定に戻す。
 */
export function useSidebarCollapse() {
  const [collapsed, setCollapsed] = useState(() => {
    const narrow = window.matchMedia(NARROW_QUERY).matches;
    const saved = readSavedState();
    return saved !== null && saved.narrow === narrow ? saved.collapsed : narrow;
  });

  useEffect(() => {
    const query = window.matchMedia(NARROW_QUERY);
    const handleChange = (event: MediaQueryListEvent) => setCollapsed(event.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    saveState({ collapsed, narrow: window.matchMedia(NARROW_QUERY).matches });
  }, [collapsed]);

  const toggle = useCallback(() => setCollapsed((prev) => !prev), []);

  return { collapsed, toggle };
}

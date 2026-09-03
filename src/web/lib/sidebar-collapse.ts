import { useCallback, useEffect, useState } from "react";

// サイドバー(248px)とサイドピーク(480px)を同時に開いても一覧が潰れない幅を境界にする
const NARROW_QUERY = "(max-width: 1023px)";

/**
 * サイドバーの折り畳み状態。狭い幅では折り畳みを既定にする。
 * 手動での開閉は、境界をまたぐまで（次のchangeが来るまで）維持される。
 */
export function useSidebarCollapse() {
  const [collapsed, setCollapsed] = useState(() => window.matchMedia(NARROW_QUERY).matches);

  useEffect(() => {
    const query = window.matchMedia(NARROW_QUERY);
    const handleChange = (event: MediaQueryListEvent) => setCollapsed(event.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  const toggle = useCallback(() => setCollapsed((prev) => !prev), []);

  return { collapsed, toggle };
}

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { GitCommitIcon } from "./icons";

interface CommitOutcome {
  committed: boolean;
  message: string | null;
  fileCount: number;
  error?: string;
}

interface CommitResult {
  ok: boolean;
  text: string;
}

const RESULT_VISIBLE_MS = 6000;

/**
 * `.rrmap`配下の変更を`rrmap commit`と同じ手順でまとめてコミットする。
 * 組み立てたコミットメッセージを確認できるよう、結果はボタンの隣に数秒だけ出す。
 */
export function CommitButton() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<CommitResult | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const showResult = (next: CommitResult) => {
    setResult(next);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setResult(null), RESULT_VISIBLE_MS);
  };

  const handleClick = async () => {
    if (running) {
      return;
    }
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/commit", { method: "POST" });
      const outcome = (await res.json()) as CommitOutcome;
      if (!res.ok) {
        showResult({ ok: false, text: outcome.error ?? "コミットに失敗しました" });
      } else if (!outcome.committed) {
        showResult({ ok: true, text: "コミットする変更はありません" });
      } else {
        showResult({
          ok: true,
          text: `${outcome.fileCount}件コミット: ${outcome.message}`,
        });
      }
    } catch (error) {
      showResult({ ok: false, text: String(error) });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex min-w-0 items-center gap-2">
      {result && (
        <span
          title={result.text}
          className={cn(
            "max-w-[280px] truncate text-xs",
            result.ok ? "text-muted-foreground" : "text-destructive",
          )}
        >
          {result.text}
        </span>
      )}
      <button
        type="button"
        onClick={handleClick}
        disabled={running}
        title=".rrmap配下の変更をまとめてコミットする"
        className="flex flex-shrink-0 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-default disabled:opacity-60 disabled:hover:bg-background disabled:hover:text-muted-foreground"
      >
        <GitCommitIcon />
        {running ? "コミット中..." : "コミット"}
      </button>
    </div>
  );
}

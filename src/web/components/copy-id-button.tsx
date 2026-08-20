import { useState } from "react";
import { CopyCheckIcon, CopyIcon } from "./icons";

export function CopyIdButton({ id, className }: { id: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="IDをコピー"
      className={`inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground ${className ?? ""}`}
    >
      {copied ? <CopyCheckIcon /> : <CopyIcon />}
    </button>
  );
}

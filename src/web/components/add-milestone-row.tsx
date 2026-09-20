import { type FormEvent, useEffect, useRef, useState } from "react";
import { PlusIcon } from "./icons";

/**
 * マイルストーンはタスクほど頻繁には作らないので、入力欄は常設せず
 * ボタンを押したときだけ開く。サイドバーの＋からも openRequested 経由で開ける。
 */
export function AddMilestoneRow({
  onAdd,
  openRequested,
  onOpenHandled,
}: {
  onAdd: (title: string) => Promise<void>;
  openRequested: boolean;
  onOpenHandled: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!openRequested) {
      return;
    }
    // 受け取った合図は一度で消す。そうしないとビューを往復しただけで再び開いてしまう
    onOpenHandled();
    setEditing(true);
    // すでに開いているときはここでフォーカスが戻る。
    // 閉じていたときはinputがまだ無いので、下のuseEffectが描画後にフォーカスする
    inputRef.current?.focus();
  }, [openRequested, onOpenHandled]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  const close = () => {
    setValue("");
    setEditing(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const title = value.trim();
    if (title === "" || submitting) {
      return;
    }
    setSubmitting(true);
    try {
      await onAdd(title);
      // 作成すると詳細パネルが開くので、入力欄は閉じて邪魔にならないようにする
      close();
    } finally {
      setSubmitting(false);
    }
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="mb-8 flex w-full items-center gap-3 rounded-md px-1.5 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <span className="flex w-[18px] flex-shrink-0 items-center justify-center">
          <PlusIcon />
        </span>
        マイルストーンを追加
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 flex items-center gap-3 rounded-md bg-muted px-1.5 py-2.5"
    >
      <span className="flex w-[18px] flex-shrink-0 items-center justify-center text-muted-foreground">
        <PlusIcon />
      </span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            close();
          }
        }}
        // 書きかけを消してしまわないよう、空のまま離れたときだけ閉じる
        onBlur={() => {
          if (value.trim() === "" && !submitting) {
            close();
          }
        }}
        placeholder="マイルストーン名"
        disabled={submitting}
        className="flex-1 border-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
      />
    </form>
  );
}

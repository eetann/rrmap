import { type FormEvent, useState } from "react";
import { PlusIcon } from "./icons";

export function AddTaskRow({ onAdd }: { onAdd: (title: string) => Promise<void> }) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const title = value.trim();
    if (title === "" || submitting) {
      return;
    }
    setSubmitting(true);
    try {
      await onAdd(title);
      setValue("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-3 rounded-md px-1.5 py-2.5 focus-within:bg-muted"
    >
      <span className="flex w-[18px] flex-shrink-0 items-center justify-center text-muted-foreground">
        <PlusIcon />
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="タスクを追加"
        disabled={submitting}
        className="flex-1 border-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
      />
    </form>
  );
}

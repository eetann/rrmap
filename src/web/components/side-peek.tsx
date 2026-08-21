import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  MILESTONE_STATUS_META,
  MILESTONE_STATUS_OPTIONS,
  TASK_STATUS_META,
  TASK_STATUS_OPTIONS,
} from "@/lib/status";
import type { Milestone, MilestoneStatus } from "../../milestone";
import type { Task, TaskStatus } from "../../task";
import { CopyIdButton } from "./copy-id-button";
import { XIcon } from "./icons";

const BODY_PLACEHOLDER = "メモを書く（方針・意思決定など）";

export type SidePeekTarget =
  | { type: "task"; task: Task }
  | { type: "milestone"; milestone: Milestone; relatedTasks: Task[] };

export function SidePeek({
  target,
  milestones,
  onClose,
  onTaskChange,
  onMilestoneChange,
  onOpenTask,
}: {
  target: SidePeekTarget;
  milestones: Milestone[];
  onClose: () => void;
  onTaskChange: (
    id: string,
    patch: Partial<Pick<Task, "title" | "status" | "milestone" | "body">>,
    debounce?: boolean,
  ) => void;
  onMilestoneChange: (
    id: string,
    patch: Partial<Pick<Milestone, "title" | "status" | "hidden" | "body">>,
    debounce?: boolean,
  ) => void;
  onOpenTask: (id: string) => void;
}) {
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const targetKey =
    target.type === "task" ? `task-${target.task.id}` : `milestone-${target.milestone.id}`;
  const [isEditingBody, setIsEditingBody] = useState(false);
  const isComposingTitleRef = useRef(false);
  const isComposingBodyRef = useRef(false);
  const isTitleFocusedRef = useRef(false);
  const isBodyFocusedRef = useRef(false);

  useEffect(() => {
    titleRef.current?.focus();
    titleRef.current?.select();
  }, []);

  useEffect(() => {
    setIsEditingBody(false);
    isComposingTitleRef.current = false;
    isComposingBodyRef.current = false;
    isTitleFocusedRef.current = false;
    isBodyFocusedRef.current = false;
  }, [targetKey]);

  useEffect(() => {
    if (isEditingBody) {
      bodyRef.current?.focus();
    }
  }, [isEditingBody]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const idLabel = target.type === "task" ? target.task.id : target.milestone.id;
  const title = target.type === "task" ? target.task.title : target.milestone.title;
  const body = target.type === "task" ? target.task.body : target.milestone.body;
  const statusMeta =
    target.type === "task"
      ? TASK_STATUS_META[target.task.status]
      : MILESTONE_STATUS_META[target.milestone.status];

  const [titleValue, setTitleValue] = useState(title);
  const [bodyValue, setBodyValue] = useState(body);

  // 自動保存後のSSE再取得でpropsが更新された際、編集中に上書きすると
  // 未確定文字の確定や入力中の文字が巻き戻ってしまうため、
  // フォーカス中・IME変換中は同期しない（blur時にflushして追いつかせる）
  useEffect(() => {
    if (!isComposingTitleRef.current && !isTitleFocusedRef.current) {
      setTitleValue(title);
    }
  }, [title]);

  useEffect(() => {
    if (!isComposingBodyRef.current && !isBodyFocusedRef.current) {
      setBodyValue(body);
    }
  }, [body]);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) {
      return;
    }
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [titleValue]);

  const commitTitle = (value: string, debounce: boolean) => {
    if (target.type === "task") {
      onTaskChange(target.task.id, { title: value }, debounce);
    } else {
      onMilestoneChange(target.milestone.id, { title: value }, debounce);
    }
  };

  const commitBody = (value: string, debounce: boolean) => {
    if (target.type === "task") {
      onTaskChange(target.task.id, { body: value }, debounce);
    } else {
      onMilestoneChange(target.milestone.id, { body: value }, debounce);
    }
  };

  const handleTitleChange = (value: string) => {
    setTitleValue(value);
    commitTitle(value, true);
  };

  const handleBodyChange = (value: string) => {
    setBodyValue(value);
    commitBody(value, true);
  };

  const handleStatusChange = (value: string) => {
    if (target.type === "task") {
      onTaskChange(target.task.id, { status: value as TaskStatus });
    } else {
      onMilestoneChange(target.milestone.id, { status: value as MilestoneStatus });
    }
  };

  return (
    <div
      key={targetKey}
      className="sticky top-0 flex h-screen w-[480px] flex-shrink-0 flex-col border-l border-border bg-background"
      style={{ animation: "side-peek-slide-in 160ms ease-out" }}
    >
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground tabular-nums">{idLabel}</span>
          <CopyIdButton id={idLabel} />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <XIcon />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-4.5 overflow-y-auto px-6 py-5.5">
        <textarea
          ref={titleRef}
          rows={1}
          value={titleValue}
          onChange={(e) => handleTitleChange(e.target.value)}
          onCompositionStart={() => {
            isComposingTitleRef.current = true;
          }}
          onCompositionEnd={(e) => {
            isComposingTitleRef.current = false;
            handleTitleChange(e.currentTarget.value);
          }}
          onFocus={() => {
            isTitleFocusedRef.current = true;
          }}
          onBlur={(e) => {
            isTitleFocusedRef.current = false;
            commitTitle(e.currentTarget.value, false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
            }
          }}
          className="w-full resize-none overflow-hidden break-words border-b border-transparent bg-transparent py-1 text-[19px] font-bold leading-snug text-foreground outline-none focus:border-primary"
        />

        <div className="flex items-center gap-3 text-[13px]">
          <span className="w-[88px] flex-shrink-0 text-muted-foreground">ステータス</span>
          <div
            className="inline-flex w-fit items-center rounded-full pl-3"
            style={{ background: statusMeta.bg, color: statusMeta.fg }}
          >
            <select
              value={target.type === "task" ? target.task.status : target.milestone.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="cursor-pointer appearance-none bg-transparent py-1.5 pr-5 text-[12.5px] font-semibold outline-none"
              style={{ color: "inherit" }}
            >
              {target.type === "task"
                ? TASK_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {TASK_STATUS_META[status].label}
                    </option>
                  ))
                : MILESTONE_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {MILESTONE_STATUS_META[status].label}
                    </option>
                  ))}
            </select>
          </div>
        </div>

        {target.type === "milestone" && (
          <div className="flex items-center gap-3 text-[13px]">
            <span className="w-[88px] flex-shrink-0 text-muted-foreground">タスク一覧</span>
            <label className="flex items-center gap-2 text-foreground">
              <input
                type="checkbox"
                checked={!target.milestone.hidden}
                onChange={(e) =>
                  onMilestoneChange(target.milestone.id, { hidden: !e.target.checked })
                }
                className="h-4 w-4 rounded border-border"
              />
              表示する
            </label>
          </div>
        )}

        {target.type === "task" && (
          <div className="flex items-center gap-3 text-[13px]">
            <span className="w-[88px] flex-shrink-0 text-muted-foreground">マイルストーン</span>
            <select
              value={target.task.milestone ?? ""}
              onChange={(e) =>
                onTaskChange(target.task.id, {
                  milestone: e.target.value === "" ? null : e.target.value,
                })
              }
              className="flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-[13px] text-foreground"
            >
              <option value="">未分類</option>
              {milestones.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="h-px bg-border" />

        {isEditingBody ? (
          <textarea
            ref={bodyRef}
            value={bodyValue}
            onChange={(e) => handleBodyChange(e.target.value)}
            onCompositionStart={() => {
              isComposingBodyRef.current = true;
            }}
            onCompositionEnd={(e) => {
              isComposingBodyRef.current = false;
              handleBodyChange(e.currentTarget.value);
            }}
            onFocus={() => {
              isBodyFocusedRef.current = true;
            }}
            onBlur={(e) => {
              isBodyFocusedRef.current = false;
              setIsEditingBody(false);
              commitBody(e.currentTarget.value, false);
            }}
            placeholder={BODY_PLACEHOLDER}
            className="min-h-[170px] w-full flex-1 resize-y border-none bg-transparent text-[13.5px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
          />
        ) : (
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsEditingBody(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setIsEditingBody(true);
              }
            }}
            className="min-h-[170px] w-full flex-1 cursor-text rounded-md"
          >
            {body.trim() === "" ? (
              <span className="text-[13.5px] text-muted-foreground">{BODY_PLACEHOLDER}</span>
            ) : (
              <div className="prose prose-sm max-w-none text-[13.5px] leading-relaxed text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none [&>:first-child]:mt-0 [&>:last-child]:mb-0 dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {target.type === "milestone" && (
          <div className="flex flex-col gap-1.5">
            <div className="mb-0.5 text-[11px] tracking-wide text-muted-foreground uppercase">
              このマイルストーンのタスク
            </div>
            {target.relatedTasks.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">タスクなし</p>
            ) : (
              target.relatedTasks.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => onOpenTask(t.id)}
                  className="break-words rounded-lg border border-border px-3 py-2 text-left text-[13px] hover:bg-muted"
                >
                  {t.title}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

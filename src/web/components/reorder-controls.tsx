import type { ReorderControls } from "@/lib/reorder";
import { cn } from "@/lib/utils";
import { ChevronDownIcon, ChevronUpIcon, GripIcon } from "./icons";

const buttonClass =
  "flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-border hover:text-foreground disabled:pointer-events-none disabled:opacity-30";

/**
 * つまむためのハンドルと、1つずつ動かす上下ボタン。
 * ドラッグが使えない場面（キーボード操作など）でも並び替えられるように両方出す。
 */
export function ReorderControlsGroup({
  controls,
  direction,
  className,
}: {
  controls: ReorderControls;
  direction: "vertical" | "horizontal";
  className?: string;
}) {
  const up = (
    <button
      key="up"
      type="button"
      onClick={controls.onMoveUp}
      disabled={!controls.canMoveUp}
      aria-label="上へ移動"
      title="上へ移動"
      className={buttonClass}
    >
      <ChevronUpIcon />
    </button>
  );
  const grip = (
    <span
      key="grip"
      {...controls.handleProps}
      aria-hidden="true"
      title="ドラッグして並び替え"
      className={cn(buttonClass, "cursor-grab active:cursor-grabbing")}
    >
      <GripIcon />
    </span>
  );
  const down = (
    <button
      key="down"
      type="button"
      onClick={controls.onMoveDown}
      disabled={!controls.canMoveDown}
      aria-label="下へ移動"
      title="下へ移動"
      className={buttonClass}
    >
      <ChevronDownIcon />
    </button>
  );

  return (
    <div
      className={cn(
        "flex items-center",
        direction === "vertical" ? "flex-col" : "flex-row gap-0.5",
        className,
      )}
    >
      {direction === "vertical" ? [up, grip, down] : [grip, up, down]}
    </div>
  );
}

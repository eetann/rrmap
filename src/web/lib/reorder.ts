import { type DragEvent, type PointerEvent, useCallback, useState } from "react";
import { moveItem } from "../../order";

export interface ReorderControls {
  /** 並び替え対象の行・セクションそのものに広げる */
  itemProps: {
    draggable: boolean;
    onDragStart: (e: DragEvent) => void;
    onDragOver: (e: DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: DragEvent) => void;
    onDragEnd: () => void;
  };
  /** つまむ場所に広げる。行全体をつまませたいなら itemProps と同じ要素でよい */
  handleProps: {
    onPointerDown: (e: PointerEvent) => void;
    onPointerUp: () => void;
  };
  isDragging: boolean;
  isOver: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

/**
 * 縦並びのリストをドラッグ&ドロップと上下移動で並び替える。
 *
 * リンクやテキストを選択したいだけのときにドラッグが始まらないよう、
 * 要素のdraggableはハンドルをpointerdownしたときだけ立てる。
 */
export function useDragReorder(ids: string[], onReorder: (ids: string[]) => void) {
  const [armedId, setArmedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const reset = useCallback(() => {
    setArmedId(null);
    setDraggingId(null);
    setOverId(null);
  }, []);

  const getControls = useCallback(
    (id: string): ReorderControls => {
      const index = ids.indexOf(id);
      const move = (to: number) => {
        const next = moveItem(ids, index, to);
        if (next !== ids) {
          onReorder(next);
        }
      };

      return {
        itemProps: {
          draggable: armedId === id,
          onDragStart: (e) => {
            e.dataTransfer.effectAllowed = "move";
            // Firefoxはデータを載せないとドラッグが始まらない
            e.dataTransfer.setData("text/plain", id);
            setDraggingId(id);
          },
          onDragOver: (e) => {
            if (draggingId === null || draggingId === id) {
              return;
            }
            // preventDefaultしないとドロップ可能な場所として扱われない
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            setOverId(id);
          },
          onDragLeave: () => setOverId((prev) => (prev === id ? null : prev)),
          onDrop: (e) => {
            e.preventDefault();
            if (draggingId !== null && draggingId !== id) {
              onReorder(moveItem(ids, ids.indexOf(draggingId), index));
            }
            reset();
          },
          onDragEnd: reset,
        },
        handleProps: {
          onPointerDown: (e) => {
            e.stopPropagation();
            setArmedId(id);
          },
          onPointerUp: () => setArmedId(null),
        },
        isDragging: draggingId === id,
        isOver: overId === id && draggingId !== id,
        canMoveUp: index > 0,
        canMoveDown: index >= 0 && index < ids.length - 1,
        onMoveUp: () => move(index - 1),
        onMoveDown: () => move(index + 1),
      };
    },
    [armedId, draggingId, ids, onReorder, overId, reset],
  );

  return { getControls };
}

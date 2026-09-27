/**
 * `.rrmap`配下の変更をまとめてコミットするときの、git statusの読み取りと
 * コミットメッセージの組み立て。git自体の呼び出しはcommands/commit.tsが持ち、
 * ここは文字列だけを扱う。
 */
import { ORDER_FILE_NAME } from "./order";

export const RRMAP_DIR_NAME = ".rrmap";

export const COMMIT_MESSAGE_PREFIX = "chore(rrmap): ";

export type RrmapEntryKind = "task" | "milestone";

export type RrmapEntryAction = "add" | "update" | "delete";

export interface RrmapChange {
  action: RrmapEntryAction;
  kind: RrmapEntryKind;
  id: string;
}

export interface RrmapStatus {
  changes: RrmapChange[];
  /** order.jsonだけの変更。件数ではなく「並び替え」としてまとめる */
  reordered: RrmapEntryKind[];
  /** タスクでもマイルストーンでもない.rrmap配下のファイル */
  others: string[];
}

const TASK_FILE_PATTERN = /^\.rrmap\/tasks\/(TASK-\d{4,})\.md$/;
const MILESTONE_FILE_PATTERN = /^\.rrmap\/milestones\/(MILESTONE-\d{4,})\.md$/;
const TASK_ORDER_PATH = `.rrmap/tasks/${ORDER_FILE_NAME}`;
const MILESTONE_ORDER_PATH = `.rrmap/milestones/${ORDER_FILE_NAME}`;

const ACTION_ORDER: RrmapEntryAction[] = ["add", "update", "delete"];
const KIND_ORDER: RrmapEntryKind[] = ["task", "milestone"];

/**
 * git statusの2文字のステータスコードを、コミットメッセージ上の操作へ寄せる。
 * indexとworktreeのどちらで起きた変更かは区別せず、コミットしたあとの
 * 見え方（増えた・変わった・消えた）だけを見る。
 */
function actionFromStatusCode(code: string): RrmapEntryAction {
  if (code === "??") {
    return "add";
  }
  const x = code[0];
  const y = code[1];
  if (x === "D" || y === "D") {
    return "delete";
  }
  if (x === "A") {
    return "add";
  }
  return "update";
}

/**
 * `git status --porcelain -z --no-renames`の出力を読む。
 * -zなのでパスはクォートされず、NUL区切りでそのまま並ぶ。
 */
export function parseGitStatus(output: string): RrmapStatus {
  const changes: RrmapChange[] = [];
  const reordered: RrmapEntryKind[] = [];
  const others: string[] = [];

  for (const entry of output.split("\0")) {
    // "XY " のあとにパスが続く。これより短い行は空行か壊れた出力
    if (entry.length < 4) {
      continue;
    }
    const action = actionFromStatusCode(entry.slice(0, 2));
    const path = entry.slice(3);

    const taskMatch = TASK_FILE_PATTERN.exec(path);
    if (taskMatch) {
      changes.push({ action, kind: "task", id: taskMatch[1] as string });
      continue;
    }
    const milestoneMatch = MILESTONE_FILE_PATTERN.exec(path);
    if (milestoneMatch) {
      changes.push({ action, kind: "milestone", id: milestoneMatch[1] as string });
      continue;
    }
    if (path === TASK_ORDER_PATH) {
      reordered.push("task");
      continue;
    }
    if (path === MILESTONE_ORDER_PATH) {
      reordered.push("milestone");
      continue;
    }
    others.push(path);
  }

  return { changes, reordered, others };
}

export function hasChanges(status: RrmapStatus): boolean {
  return status.changes.length > 0 || status.reordered.length > 0 || status.others.length > 0;
}

function pluralize(kind: RrmapEntryKind, count: number): string {
  return count === 1 ? kind : `${kind}s`;
}

/**
 * 同じ操作でまとめた1グループ分の文言を作る。
 * 対象が1件だけならidを出し、複数あるなら種別ごとの件数にする。
 * （例: `add TASK-0042` / `update 2 tasks, 1 milestone`）
 */
function describeGroup(action: RrmapEntryAction, changes: RrmapChange[]): string {
  const items: string[] = [];
  for (const kind of KIND_ORDER) {
    const ids = changes.filter((change) => change.kind === kind).map((change) => change.id);
    if (ids.length === 0) {
      continue;
    }
    if (ids.length === 1 && changes.length === 1) {
      items.push(ids[0] as string);
      continue;
    }
    items.push(`${ids.length} ${pluralize(kind, ids.length)}`);
  }
  return `${action} ${items.join(", ")}`;
}

/**
 * 変更内容からコミットメッセージの1行目を組み立てる。
 * あとからgit logを眺めたときに「何が動いたか」が分かる粒度を狙っていて、
 * 1件ならid、複数なら件数に丸める。
 */
export function buildCommitMessage(status: RrmapStatus): string {
  const parts: string[] = [];

  for (const action of ACTION_ORDER) {
    const changes = status.changes.filter((change) => change.action === action);
    if (changes.length > 0) {
      parts.push(describeGroup(action, changes));
    }
  }

  if (status.reordered.length > 0) {
    const kinds = KIND_ORDER.filter((kind) => status.reordered.includes(kind)).map(
      (kind) => `${kind}s`,
    );
    parts.push(`reorder ${kinds.join(", ")}`);
  }

  // タスクでもマイルストーンでもないファイルしか動いていないときのための逃げ道
  if (parts.length === 0) {
    return `${COMMIT_MESSAGE_PREFIX}update ${RRMAP_DIR_NAME}`;
  }

  return `${COMMIT_MESSAGE_PREFIX}${parts.join(", ")}`;
}

import { isTaskId } from "../task";

export function parseTaskId(raw: string): string {
  if (!isTaskId(raw)) {
    throw new Error(`invalid task id: ${raw}`);
  }
  return raw;
}

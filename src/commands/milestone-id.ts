import { isMilestoneId } from "../milestone";

export function parseMilestoneId(raw: string): string {
  if (!isMilestoneId(raw)) {
    throw new Error(`invalid milestone id: ${raw}`);
  }
  return raw;
}

export function parseTaskId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id)) {
    throw new Error(`invalid task id: ${raw}`);
  }
  return id;
}

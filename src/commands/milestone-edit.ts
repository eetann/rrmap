import { define } from "gunshi";
import { MILESTONE_STATUSES } from "../milestone";
import { readMilestone, resolveMilestonesDir, writeMilestone } from "../milestone-store";
import { parseMilestoneId } from "./milestone-id";

export const milestoneEditCommand = define({
  name: "edit",
  description: "マイルストーンを編集する",
  args: {
    id: {
      type: "positional",
      description: "マイルストーンid",
    },
    status: {
      type: "enum",
      choices: MILESTONE_STATUSES,
      description: "ステータスを変更する",
    },
    title: {
      type: "string",
      description: "タイトルを変更する",
    },
  },
  run: async (ctx) => {
    const id = parseMilestoneId(ctx.values.id);
    const milestonesDir = resolveMilestonesDir();
    const milestone = await readMilestone(milestonesDir, id);

    if (ctx.values.status !== undefined) {
      milestone.status = ctx.values.status;
    }
    if (ctx.values.title !== undefined) {
      milestone.title = ctx.values.title;
    }

    await writeMilestone(milestonesDir, milestone);
    console.log(`updated milestone ${id}`);
  },
});

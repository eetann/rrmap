import { define } from "gunshi";
import { MILESTONE_STATUSES } from "../milestone";
import { listMilestones, resolveMilestonesDir } from "../milestone-store";

export const milestoneListCommand = define({
  name: "list",
  description: "マイルストーン一覧を表示する",
  args: {
    status: {
      type: "enum",
      choices: MILESTONE_STATUSES,
      description: "ステータスで絞り込む",
    },
  },
  run: async (ctx) => {
    const milestonesDir = resolveMilestonesDir();
    let milestones = await listMilestones(milestonesDir);

    if (ctx.values.status !== undefined) {
      milestones = milestones.filter((milestone) => milestone.status === ctx.values.status);
    }

    if (milestones.length === 0) {
      console.log("no milestones");
      return;
    }

    for (const milestone of milestones) {
      const hiddenLabel = milestone.hidden ? "\t[hidden]" : "";
      console.log(`${milestone.id}\t[${milestone.status}]\t${milestone.title}${hiddenLabel}`);
    }
  },
});

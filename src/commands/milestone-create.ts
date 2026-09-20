import { define } from "gunshi";
import { nextMilestoneId } from "../milestone";
import { listMilestones, resolveMilestonesDir, writeMilestone } from "../milestone-store";

export const milestoneCreateCommand = define({
  name: "create",
  description: "マイルストーンを作成する",
  examples: `$ rrmap milestone create "マイルストーンのタイトル"

.rrmap/milestones/MILESTONE-XXXX.md を直接作成してもよい（フォーマットは \`rrmap format\` 参照）。`,
  args: {
    title: {
      type: "positional",
      description: "マイルストーンのタイトル",
    },
  },
  run: async (ctx) => {
    const { title } = ctx.values;
    const milestonesDir = resolveMilestonesDir();
    const id = nextMilestoneId(await listMilestones(milestonesDir));

    await writeMilestone(milestonesDir, {
      id,
      title,
      status: "planned",
      hidden: false,
      body: "",
    });
    console.log(`created milestone ${id}: ${title}`);
  },
});

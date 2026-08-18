import { define } from "gunshi";
import { readMilestone, resolveMilestonesDir } from "../milestone-store";
import { parseMilestoneId } from "./milestone-id";

export const milestoneShowCommand = define({
  name: "show",
  description: "マイルストーンの詳細を表示する",
  args: {
    id: {
      type: "positional",
      description: "マイルストーンid",
    },
  },
  run: async (ctx) => {
    const id = parseMilestoneId(ctx.values.id);
    const milestone = await readMilestone(resolveMilestonesDir(), id);

    console.log(`# ${milestone.title}`);
    console.log(`id: ${milestone.id}`);
    console.log(`status: ${milestone.status}`);
    console.log("");
    console.log(milestone.body);
  },
});

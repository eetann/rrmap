import { define } from "gunshi";
import { milestoneCreateCommand } from "./milestone-create";
import { milestoneEditCommand } from "./milestone-edit";
import { milestoneListCommand } from "./milestone-list";
import { milestoneShowCommand } from "./milestone-show";

export const milestoneCommand = define({
  name: "milestone",
  description: "マイルストーンを管理する",
  run: async () => {
    console.log("Usage: rrmap milestone <create|list|show|edit>");
  },
  subCommands: {
    create: milestoneCreateCommand,
    list: milestoneListCommand,
    show: milestoneShowCommand,
    edit: milestoneEditCommand,
  },
});

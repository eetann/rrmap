import { cli } from "gunshi";
import { createCommand } from "./commands/create";
import { editCommand } from "./commands/edit";
import { formatCommand } from "./commands/format";
import { listCommand } from "./commands/list";
import { milestoneCommand } from "./commands/milestone";
import { showCommand } from "./commands/show";

try {
  await cli(process.argv.slice(2), listCommand, {
    name: "rrmap",
    version: "0.0.1",
    description: "雑なロードマップをタスク単位で整理するツール",
    renderHeader: null,
    subCommands: {
      create: createCommand,
      list: listCommand,
      show: showCommand,
      edit: editCommand,
      milestone: milestoneCommand,
      format: formatCommand,
    },
  });
} catch (error) {
  console.error(`Error: ${(error as Error).message}`);
  process.exitCode = 1;
}

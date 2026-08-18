import { cli } from "gunshi";
import { createCommand } from "./commands/create.ts";
import { editCommand } from "./commands/edit.ts";
import { listCommand } from "./commands/list.ts";
import { showCommand } from "./commands/show.ts";

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
    },
  });
} catch (error) {
  console.error(`Error: ${(error as Error).message}`);
  process.exitCode = 1;
}

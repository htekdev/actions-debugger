/**
 * CLI main — commander program setup and command registration.
 */

import { Command } from "commander";
import { registerLookupCommand } from "./commands/lookup.js";
import { registerSearchCommand } from "./commands/search.js";
import { registerDiagnoseCommand } from "./commands/diagnose.js";
import { registerSuggestCommand } from "./commands/suggest.js";
import { registerCategoriesCommand } from "./commands/categories.js";

const program = new Command()
  .name("actions-debugger")
  .description("65+ real GitHub Actions errors, queryable from your terminal")
  .version("1.1.0");

registerLookupCommand(program);
registerSearchCommand(program);
registerDiagnoseCommand(program);
registerSuggestCommand(program);
registerCategoriesCommand(program);

program.parse();

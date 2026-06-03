/**
 * CLI command: categories — list all error categories.
 */

import type { Command } from "commander";
import { loadErrorDatabase } from "../../db/loader.js";
import { listCategories } from "../../tools/list-categories.js";
import { detectFormat, formatCategoriesOutput } from "../output.js";

export function registerCategoriesCommand(program: Command): void {
  program
    .command("categories")
    .description("List all error categories with counts")
    .option("--format <fmt>", "Output format: text, json, md")
    .action(async (opts: { format?: string }) => {
      try {
        const db = await loadErrorDatabase();
        const categories = listCategories(db);
        const format = detectFormat(opts.format);
        console.log(formatCategoriesOutput(categories, format));
        process.exit(0);
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(3);
      }
    });
}

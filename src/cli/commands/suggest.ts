/**
 * CLI command: suggest-fix — contextual fix suggestions.
 */

import type { Command } from "commander";
import { loadErrorDatabase } from "../../db/loader.js";
import { suggestFix } from "../../tools/suggest-fix.js";
import { detectFormat, formatSuggestOutput } from "../output.js";

export function registerSuggestCommand(program: Command): void {
  program
    .command("suggest-fix <error_context>")
    .description("Get contextual fix suggestions for an error")
    .option("--category <cat>", "Narrow search to a specific category")
    .option("--format <fmt>", "Output format: text, json, md")
    .action(async (errorContext: string, opts: { category?: string; format?: string }) => {
      try {
        const db = await loadErrorDatabase();
        const results = suggestFix(db, errorContext, opts.category);
        const format = detectFormat(opts.format);
        console.log(formatSuggestOutput(results, format));
        process.exit(results.length > 0 ? 0 : 1);
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(3);
      }
    });
}

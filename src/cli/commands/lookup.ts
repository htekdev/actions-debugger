/**
 * CLI command: lookup — match error message against known issues.
 */

import type { Command } from "commander";
import { loadErrorDatabase } from "../../db/loader.js";
import { lookupError } from "../../tools/lookup-error.js";
import { detectFormat, formatLookupOutput } from "../output.js";

export function registerLookupCommand(program: Command): void {
  program
    .command("lookup <error_message>")
    .description("Match an error message against known issues")
    .option("--max-results <n>", "Maximum number of results to return", "3")
    .option("--format <fmt>", "Output format: text, json, md")
    .action(async (errorMessage: string, opts: { maxResults: string; format?: string }) => {
      try {
        const db = await loadErrorDatabase();
        const results = lookupError(db, errorMessage, parseInt(opts.maxResults, 10));
        const format = detectFormat(opts.format);
        console.log(formatLookupOutput(results, format));
        process.exit(results.length > 0 ? 0 : 1);
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(3);
      }
    });
}

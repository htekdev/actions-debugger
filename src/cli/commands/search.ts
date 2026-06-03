/**
 * CLI command: search — full-text search across the error database.
 */

import type { Command } from "commander";
import { loadErrorDatabase } from "../../db/loader.js";
import { searchErrors } from "../../tools/search-errors.js";
import { detectFormat, formatSearchOutput } from "../output.js";

export function registerSearchCommand(program: Command): void {
  program
    .command("search <query>")
    .description("Search error database by keyword")
    .option("--category <cat>", "Filter by category")
    .option("--severity <sev>", "Filter by severity (error, warning, silent-failure, limitation)")
    .option("--max-results <n>", "Maximum number of results to return", "10")
    .option("--format <fmt>", "Output format: text, json, md")
    .action(async (query: string, opts: { category?: string; severity?: string; maxResults: string; format?: string }) => {
      try {
        const db = await loadErrorDatabase();
        const results = searchErrors(db, query, {
          category: opts.category,
          severity: opts.severity,
          maxResults: parseInt(opts.maxResults, 10),
        });
        const format = detectFormat(opts.format);
        console.log(formatSearchOutput(results, format));
        process.exit(results.length > 0 ? 0 : 1);
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(3);
      }
    });
}

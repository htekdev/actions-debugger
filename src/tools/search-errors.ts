/**
 * search_errors tool — full-text search across the error database.
 */

import type { ErrorDatabase, ErrorEntry } from "../db/types.js";
import { searchByKeyword } from "../db/search.js";

/**
 * Search the error database by keyword, tag, or category.
 */
export function searchErrors(
  db: ErrorDatabase,
  query: string,
  options?: {
    category?: string;
    severity?: string;
    maxResults?: number;
  }
): ErrorEntry[] {
  const results = searchByKeyword(db, query, options);
  return results.map(r => r.entry);
}

/**
 * Format search results as human-readable string.
 */
export function formatSearchResult(results: ErrorEntry[]): string {
  if (results.length === 0) {
    return "No results found. Try a different search query or browse categories with `list_categories`.";
  }

  const lines = [
    `## Search Results (${results.length} match${results.length === 1 ? "" : "es"})`,
    "",
  ];

  for (const entry of results) {
    lines.push(`### ${entry.title}`);
    lines.push(`**ID:** ${entry.id} | **Category:** ${entry.category} | **Severity:** ${entry.severity}`);
    lines.push("");
    lines.push(entry.root_cause.trim().split("\n")[0] + "...");
    lines.push("");
  }

  lines.push(`*Source: [Full Guide](https://htek.dev/articles/github-actions-debugging-guide)*`);

  return lines.join("\n");
}

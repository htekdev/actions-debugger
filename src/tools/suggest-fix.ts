/**
 * suggest_fix tool — contextual fix suggestions.
 */

import type { ErrorDatabase, ErrorEntry } from "../db/types.js";
import { lookupByPattern, searchByKeyword } from "../db/search.js";

/**
 * Suggest a fix given broader error context.
 */
export function suggestFix(
  db: ErrorDatabase,
  errorContext: string,
  category?: string
): ErrorEntry[] {
  // Try regex matching first
  let results = lookupByPattern(db, errorContext, 5);

  // Apply category filter if provided (pattern matching doesn't filter by category)
  if (category) {
    results = results.filter(r => r.entry.category === category);
  }

  // If no matches after filtering, fall back to keyword search with category filter
  if (results.length === 0) {
    results = searchByKeyword(db, errorContext, { category, maxResults: 5 });
  }

  return results.map(r => r.entry);
}

/**
 * Format suggest_fix results.
 */
export function formatSuggestResult(results: ErrorEntry[]): string {
  if (results.length === 0) {
    return [
      "No matching errors found for this context.",
      "",
      "**Try:**",
      "1. Paste the exact error message for a more precise match",
      "2. Search by category: `search_errors` with a category filter",
      "3. Check the full guide: https://htek.dev/articles/github-actions-debugging-guide",
    ].join("\n");
  }

  const best = results[0];
  const lines = [
    `## Suggested Fix: ${best.title}`,
    "",
    `**Category:** ${best.category} | **Severity:** ${best.severity}`,
    "",
    `**Root Cause:**`,
    best.root_cause.trim(),
    "",
    `**Fix:**`,
    best.fix.trim(),
  ];

  if (best.fix_code?.length) {
    lines.push("");
    for (const fc of best.fix_code) {
      lines.push(`\`\`\`${fc.language}`);
      lines.push(fc.code.trim());
      lines.push("```");
    }
  }

  if (results.length > 1) {
    lines.push("", "**Other possible matches:**");
    for (const entry of results.slice(1)) {
      lines.push(`- ${entry.title} (${entry.category})`);
    }
  }

  if (best.source?.article) {
    lines.push("", `**Source:** [Full Guide](${best.source.article})`);
  }

  return lines.join("\n");
}

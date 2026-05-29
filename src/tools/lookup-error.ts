/**
 * lookup_error tool — match error messages against the known error database.
 */

import type { ErrorDatabase, SearchResult, ErrorEntry } from "../db/types.js";
import { lookupByPattern } from "../db/search.js";

export interface LookupErrorInput {
  error_message: string;
  max_results?: number;
}

/**
 * Look up an error message in the database.
 * Returns matching errors with root cause and fix.
 */
export function lookupError(
  db: ErrorDatabase,
  errorMessage: string,
  maxResults: number = 3
): ErrorEntry[] {
  const results = lookupByPattern(db, errorMessage, maxResults);
  return results.map(r => r.entry);
}

/**
 * Format lookup results as a human-readable MCP response.
 */
export function formatLookupResult(results: ErrorEntry[]): string {
  if (results.length === 0) {
    return [
      "No matching errors found in the database.",
      "",
      "**Suggestions:**",
      "1. Enable debug logging: set `ACTIONS_STEP_DEBUG` secret to `true`",
      "2. Run `actionlint` on your workflow files",
      "3. Check the full guide: https://htek.dev/articles/github-actions-debugging-guide",
    ].join("\n");
  }

  return results
    .map((entry, i) => {
      const lines = [
        `## ${i > 0 ? `Match ${i + 1}: ` : ""}${entry.title}`,
        "",
        `**Category:** ${entry.category} | **Severity:** ${entry.severity}`,
        "",
        `**Root Cause:**`,
        entry.root_cause.trim(),
        "",
        `**Fix:**`,
        entry.fix.trim(),
      ];

      if (entry.fix_code?.length) {
        lines.push("");
        for (const fc of entry.fix_code) {
          lines.push(`\`\`\`${fc.language}`);
          lines.push(fc.code.trim());
          lines.push("```");
        }
      }

      if (entry.prevention?.length) {
        lines.push("", "**Prevention:**");
        for (const p of entry.prevention) {
          lines.push(`- ${p}`);
        }
      }

      if (entry.docs?.length) {
        lines.push("", "**Docs:**");
        for (const d of entry.docs) {
          lines.push(`- [${d.label}](${d.url})`);
        }
      }

      if (entry.source?.article) {
        lines.push("", `**Source:** [Full Guide](${entry.source.article})`);
      }

      return lines.join("\n");
    })
    .join("\n\n---\n\n");
}

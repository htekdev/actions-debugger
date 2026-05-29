/**
 * list_categories tool — list all error categories with counts.
 */

import type { ErrorDatabase, ErrorCategory, ErrorSeverity, CategoryInfo } from "../db/types.js";

/**
 * List all categories with error counts and severity breakdown.
 */
export function listCategories(db: ErrorDatabase): CategoryInfo[] {
  const categories: CategoryInfo[] = [];

  for (const [name, entries] of db.categories) {
    const severities: Record<ErrorSeverity, number> = {
      error: 0,
      warning: 0,
      "silent-failure": 0,
      limitation: 0,
    };

    for (const entry of entries) {
      severities[entry.severity]++;
    }

    categories.push({ name, count: entries.length, severities });
  }

  // Sort by count descending
  categories.sort((a, b) => b.count - a.count);
  return categories;
}

/**
 * Format category list as human-readable string.
 */
export function formatCategoryList(categories: CategoryInfo[]): string {
  const totalErrors = categories.reduce((sum, c) => sum + c.count, 0);

  const lines = [
    `## Error Categories (${totalErrors} total errors)`,
    "",
    "| Category | Count | Severities |",
    "|----------|-------|------------|",
  ];

  for (const cat of categories) {
    const sevParts: string[] = [];
    if (cat.severities.error) sevParts.push(`${cat.severities.error} error`);
    if (cat.severities.warning) sevParts.push(`${cat.severities.warning} warning`);
    if (cat.severities["silent-failure"]) sevParts.push(`${cat.severities["silent-failure"]} silent`);
    if (cat.severities.limitation) sevParts.push(`${cat.severities.limitation} limitation`);

    lines.push(`| \`${cat.name}\` | ${cat.count} | ${sevParts.join(", ")} |`);
  }

  lines.push("", `*Source: [GitHub Actions Debugging Guide](https://htek.dev/articles/github-actions-debugging-guide)*`);

  return lines.join("\n");
}

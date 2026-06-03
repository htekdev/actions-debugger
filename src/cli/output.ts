/**
 * Output formatters for CLI commands.
 * Supports text (human-friendly), json (machine-parseable), and md (markdown).
 */

import type { ErrorEntry, DiagnosticFinding, CategoryInfo } from "../db/types.js";

export type OutputFormat = "text" | "json" | "md";

/**
 * Detect the appropriate output format.
 * TTY → text, piped → json, or explicit user choice.
 */
export function detectFormat(explicit?: string): OutputFormat {
  if (explicit && explicit !== "auto") return explicit as OutputFormat;
  return process.stdout.isTTY ? "text" : "json";
}

// ─── Lookup ─────────────────────────────────────────────────────────────────

export function formatLookupOutput(results: ErrorEntry[], format: OutputFormat): string {
  if (format === "json") {
    return JSON.stringify({ matches: results.map(entryToJson) }, null, 2);
  }
  if (format === "md") {
    return formatLookupMd(results);
  }
  return formatLookupText(results);
}

function formatLookupText(results: ErrorEntry[]): string {
  if (results.length === 0) {
    return "No matching errors found.\n\nTry `actions-debugger search <keyword>` for broader results.";
  }

  return results.map((entry) => {
    const lines = [
      `✓ Match: ${entry.title}`,
      `  Category: ${entry.category} | Severity: ${entry.severity}`,
      "",
      `  Root Cause: ${entry.root_cause.trim()}`,
      "",
      `  Fix: ${entry.fix.trim()}`,
    ];

    if (entry.fix_code?.length) {
      lines.push("");
      for (const fc of entry.fix_code) {
        lines.push(`  ${fc.label || fc.language}:`);
        for (const line of fc.code.trim().split("\n")) {
          lines.push(`    ${line}`);
        }
      }
    }

    if (entry.prevention?.length) {
      lines.push("", "  Prevention:");
      for (const p of entry.prevention) {
        lines.push(`    - ${p}`);
      }
    }

    if (entry.docs?.length) {
      lines.push("", "  Docs:");
      for (const d of entry.docs) {
        lines.push(`    - ${d.label}: ${d.url}`);
      }
    }

    return lines.join("\n");
  }).join("\n\n---\n\n");
}

function formatLookupMd(results: ErrorEntry[]): string {
  if (results.length === 0) {
    return "No matching errors found.";
  }

  return results.map((entry, i) => {
    const lines = [
      `## ${i > 0 ? `Match ${i + 1}: ` : ""}${entry.title}`,
      "",
      `**Category:** ${entry.category} | **Severity:** ${entry.severity}`,
      "",
      `**Root Cause:** ${entry.root_cause.trim()}`,
      "",
      `**Fix:** ${entry.fix.trim()}`,
    ];

    if (entry.fix_code?.length) {
      for (const fc of entry.fix_code) {
        lines.push("", `\`\`\`${fc.language}`, fc.code.trim(), "```");
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

    return lines.join("\n");
  }).join("\n\n---\n\n");
}

// ─── Search ─────────────────────────────────────────────────────────────────

export function formatSearchOutput(results: ErrorEntry[], format: OutputFormat): string {
  if (format === "json") {
    return JSON.stringify({ matches: results.map(entryToJson) }, null, 2);
  }
  if (format === "md") {
    return formatSearchMd(results);
  }
  return formatSearchText(results);
}

function formatSearchText(results: ErrorEntry[]): string {
  if (results.length === 0) {
    return "No results found. Try different keywords or browse with `actions-debugger categories`.";
  }

  const lines = [`Found ${results.length} result(s):`, ""];
  for (const entry of results) {
    lines.push(`  ${entry.title}`);
    lines.push(`    ${entry.category} | ${entry.severity} | ${entry.root_cause.trim().split("\n")[0]}`);
    lines.push("");
  }
  return lines.join("\n");
}

function formatSearchMd(results: ErrorEntry[]): string {
  if (results.length === 0) return "No results found.";

  const lines = [`## Search Results (${results.length})`, ""];
  for (const entry of results) {
    lines.push(`### ${entry.title}`);
    lines.push(`**Category:** ${entry.category} | **Severity:** ${entry.severity}`);
    lines.push("", entry.root_cause.trim().split("\n")[0], "");
  }
  return lines.join("\n");
}

// ─── Diagnose ───────────────────────────────────────────────────────────────

export function formatDiagnoseOutput(findings: DiagnosticFinding[], format: OutputFormat): string {
  if (format === "json") {
    return JSON.stringify({ findings }, null, 2);
  }
  if (format === "md") {
    return formatDiagnoseMd(findings);
  }
  return formatDiagnoseText(findings);
}

function formatDiagnoseText(findings: DiagnosticFinding[]): string {
  if (findings.length === 0) {
    return "✅ No issues found. Workflow looks good!";
  }

  const lines = [`Found ${findings.length} issue(s):`, ""];
  const icons: Record<string, string> = { critical: "🔴", high: "🟠", medium: "🟡", low: "🔵" };

  for (const f of findings) {
    lines.push(`  ${icons[f.severity] || "•"} [${f.severity}] ${f.message}`);
    lines.push(`    Fix: ${f.fix}`);
    if (f.fix_code) {
      for (const line of f.fix_code.split("\n")) {
        lines.push(`      ${line}`);
      }
    }
    lines.push("");
  }
  return lines.join("\n");
}

function formatDiagnoseMd(findings: DiagnosticFinding[]): string {
  if (findings.length === 0) return "✅ No issues found.";

  const lines = [`## Workflow Analysis — ${findings.length} issue(s)`, ""];
  for (const f of findings) {
    lines.push(`- **[${f.severity}]** ${f.message}`);
    lines.push(`  - Fix: ${f.fix}`);
    if (f.fix_code) {
      lines.push("  ```", `  ${f.fix_code}`, "  ```");
    }
  }
  return lines.join("\n");
}

// ─── Suggest ────────────────────────────────────────────────────────────────

export function formatSuggestOutput(results: ErrorEntry[], format: OutputFormat): string {
  if (format === "json") {
    return JSON.stringify({ suggestions: results.map(entryToJson) }, null, 2);
  }
  if (format === "md") {
    return formatSuggestMd(results);
  }
  return formatSuggestText(results);
}

function formatSuggestText(results: ErrorEntry[]): string {
  if (results.length === 0) {
    return "No matching suggestions. Try `actions-debugger lookup <exact error message>` for better results.";
  }

  const best = results[0];
  const lines = [
    `✓ Suggested Fix: ${best.title}`,
    `  Category: ${best.category} | Severity: ${best.severity}`,
    "",
    `  Root Cause: ${best.root_cause.trim()}`,
    "",
    `  Fix: ${best.fix.trim()}`,
  ];

  if (best.fix_code?.length) {
    lines.push("");
    for (const fc of best.fix_code) {
      lines.push(`  ${fc.label || fc.language}:`);
      for (const line of fc.code.trim().split("\n")) {
        lines.push(`    ${line}`);
      }
    }
  }

  if (results.length > 1) {
    lines.push("", "  Other possible matches:");
    for (const entry of results.slice(1)) {
      lines.push(`    - ${entry.title} (${entry.category})`);
    }
  }

  return lines.join("\n");
}

function formatSuggestMd(results: ErrorEntry[]): string {
  if (results.length === 0) return "No matching suggestions.";

  const best = results[0];
  const lines = [
    `## Suggested Fix: ${best.title}`,
    "",
    `**Category:** ${best.category} | **Severity:** ${best.severity}`,
    "",
    `**Root Cause:** ${best.root_cause.trim()}`,
    "",
    `**Fix:** ${best.fix.trim()}`,
  ];

  if (best.fix_code?.length) {
    for (const fc of best.fix_code) {
      lines.push("", `\`\`\`${fc.language}`, fc.code.trim(), "```");
    }
  }

  if (results.length > 1) {
    lines.push("", "**Other possible matches:**");
    for (const entry of results.slice(1)) {
      lines.push(`- ${entry.title} (${entry.category})`);
    }
  }

  return lines.join("\n");
}

// ─── Categories ─────────────────────────────────────────────────────────────

export function formatCategoriesOutput(categories: CategoryInfo[], format: OutputFormat): string {
  if (format === "json") {
    return JSON.stringify({
      categories: categories.map((c) => ({
        name: c.name,
        count: c.count,
        severities: c.severities,
      })),
    }, null, 2);
  }
  if (format === "md") {
    return formatCategoriesMd(categories);
  }
  return formatCategoriesText(categories);
}

function formatCategoriesText(categories: CategoryInfo[]): string {
  const total = categories.reduce((sum, c) => sum + c.count, 0);
  const nameWidth = Math.max(...categories.map((c) => c.name.length), 10);

  const lines = [
    `Error Categories (${total} total errors)`,
    "",
    `${"Category".padEnd(nameWidth)}  Count  Severities`,
    "─".repeat(nameWidth + 40),
  ];

  for (const cat of categories) {
    const sevParts: string[] = [];
    if (cat.severities.error) sevParts.push(`${cat.severities.error} error`);
    if (cat.severities.warning) sevParts.push(`${cat.severities.warning} warning`);
    if (cat.severities["silent-failure"]) sevParts.push(`${cat.severities["silent-failure"]} silent`);
    if (cat.severities.limitation) sevParts.push(`${cat.severities.limitation} limitation`);

    lines.push(
      `${cat.name.padEnd(nameWidth)}  ${String(cat.count).padStart(5)}  ${sevParts.join(", ")}`
    );
  }

  return lines.join("\n");
}

function formatCategoriesMd(categories: CategoryInfo[]): string {
  const total = categories.reduce((sum, c) => sum + c.count, 0);
  const lines = [
    `## Error Categories (${total} total)`,
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

  return lines.join("\n");
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function entryToJson(entry: ErrorEntry) {
  return {
    id: entry.id,
    title: entry.title,
    category: entry.category,
    severity: entry.severity,
    root_cause: entry.root_cause.trim(),
    fix: entry.fix.trim(),
    fix_code: entry.fix_code?.map((fc) => ({ language: fc.language, code: fc.code.trim() })),
    prevention: entry.prevention,
    docs: entry.docs,
    tags: entry.tags,
  };
}

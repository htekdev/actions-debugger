/**
 * diagnose_workflow tool — analyze workflow YAML for common mistakes.
 */

import type { ErrorDatabase, DiagnosticFinding } from "../db/types.js";
import { analyzeWorkflow } from "../utils/yaml-parser.js";

/**
 * Diagnose a workflow YAML for common issues.
 */
export function diagnoseWorkflow(
  db: ErrorDatabase,
  workflowYaml: string
): DiagnosticFinding[] {
  return analyzeWorkflow(workflowYaml);
}

/**
 * Format diagnostic findings as a human-readable string.
 */
export function formatDiagnosticResult(findings: DiagnosticFinding[]): string {
  if (findings.length === 0) {
    return "✅ No issues found. Workflow looks good!";
  }

  const grouped: Record<string, DiagnosticFinding[]> = {
    critical: [],
    high: [],
    medium: [],
    low: [],
  };

  for (const f of findings) {
    grouped[f.severity].push(f);
  }

  const lines: string[] = [
    `## Workflow Analysis — ${findings.length} issue(s) found`,
    "",
  ];

  const severityLabels: Record<string, string> = {
    critical: "🔴 Critical",
    high: "🟠 High",
    medium: "🟡 Medium",
    low: "🔵 Low",
  };

  for (const [sev, label] of Object.entries(severityLabels)) {
    const items = grouped[sev];
    if (items.length === 0) continue;

    lines.push(`### ${label} (${items.length})`);
    for (const f of items) {
      lines.push(`- **${f.message}**`);
      lines.push(`  Fix: ${f.fix}`);
      if (f.fix_code) {
        lines.push(`  \`\`\`\n  ${f.fix_code}\n  \`\`\``);
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}

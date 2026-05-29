/**
 * Workflow YAML analysis utilities.
 * Parses GitHub Actions workflow YAML and checks for common mistakes.
 */

import yaml from "js-yaml";
import type { DiagnosticFinding } from "../db/types.js";

interface WorkflowJob {
  "runs-on"?: string;
  permissions?: Record<string, string>;
  "timeout-minutes"?: number;
  concurrency?: { group?: string; "cancel-in-progress"?: boolean } | string;
  steps?: WorkflowStep[];
  needs?: string | string[];
}

interface WorkflowStep {
  name?: string;
  uses?: string;
  run?: string;
  shell?: string;
  if?: string;
  with?: Record<string, unknown>;
}

interface Workflow {
  name?: string;
  on?: Record<string, unknown> | string | string[];
  permissions?: Record<string, string>;
  jobs?: Record<string, WorkflowJob>;
  defaults?: { run?: { shell?: string } };
}

/**
 * Analyze a workflow YAML string for common issues.
 */
export function analyzeWorkflow(workflowYaml: string): DiagnosticFinding[] {
  const findings: DiagnosticFinding[] = [];

  // Check for tab characters (before parsing — YAML rejects tabs)
  if (workflowYaml.includes("\t")) {
    findings.push({
      severity: "critical",
      message: "Tab characters detected — GitHub Actions requires spaces for indentation.",
      fix: "Replace all tabs with spaces (2-space indentation recommended).",
      fix_code: "# Use .editorconfig:\nindent_style = space\nindent_size = 2",
    });
  }

  let workflow: Workflow;
  try {
    workflow = yaml.load(workflowYaml) as Workflow;
  } catch (err) {
    findings.push({
      severity: "critical",
      message: `YAML parse error: ${(err as Error).message}`,
      fix: "Fix the YAML syntax error before proceeding.",
    });
    return findings;
  }

  if (!workflow || typeof workflow !== "object") {
    findings.push({
      severity: "critical",
      message: "Workflow is empty or not a valid YAML object.",
      fix: "Ensure the file contains a valid GitHub Actions workflow.",
    });
    return findings;
  }

  // Check jobs
  if (!workflow.jobs || Object.keys(workflow.jobs).length === 0) {
    findings.push({
      severity: "critical",
      message: "No jobs defined in workflow.",
      fix: "Add at least one job under the `jobs:` key.",
    });
    return findings;
  }

  const hasTopLevelPermissions = !!workflow.permissions;

  for (const [jobName, job] of Object.entries(workflow.jobs)) {
    // Missing runs-on
    if (!job["runs-on"]) {
      findings.push({
        severity: "critical",
        message: `Job '${jobName}' is missing 'runs-on'.`,
        fix: "Add runs-on: ubuntu-latest (or another runner label).",
        fix_code: `jobs:\n  ${jobName}:\n    runs-on: ubuntu-latest`,
      });
    }

    // Missing permissions
    if (!hasTopLevelPermissions && !job.permissions) {
      findings.push({
        severity: "high",
        message: `Job '${jobName}' has no 'permissions:' block — defaults are read-only since Feb 2023.`,
        fix: "Add explicit permissions for the GITHUB_TOKEN.",
        fix_code: `permissions:\n  contents: read`,
      });
    }

    // Missing timeout
    if (!job["timeout-minutes"]) {
      findings.push({
        severity: "medium",
        message: `Job '${jobName}' has no 'timeout-minutes' — default is 6 hours.`,
        fix: "Add timeout-minutes to prevent runaway jobs.",
        fix_code: `jobs:\n  ${jobName}:\n    timeout-minutes: 30`,
      });
    }

    // Check steps
    for (const step of job.steps ?? []) {
      // Deprecated set-output
      if (step.run?.includes("::set-output")) {
        findings.push({
          severity: "high",
          message: `Step '${step.name ?? "unnamed"}' uses deprecated set-output command.`,
          fix: "Use $GITHUB_OUTPUT instead.",
          fix_code: 'echo "key=value" >> $GITHUB_OUTPUT',
          relatedError: "runner-environment-005",
        });
      }

      // Deprecated set-env
      if (step.run?.includes("::set-env")) {
        findings.push({
          severity: "high",
          message: `Step '${step.name ?? "unnamed"}' uses deprecated set-env command.`,
          fix: "Use $GITHUB_ENV instead.",
          fix_code: 'echo "KEY=value" >> $GITHUB_ENV',
        });
      }

      // Deprecated action versions
      if (step.uses) {
        // Node 16 actions
        if (step.uses.match(/actions\/upload-artifact@v3/)) {
          findings.push({
            severity: "high",
            message: `Step uses actions/upload-artifact@v3 — v4 is current and uses a different backend.`,
            fix: "Upgrade to actions/upload-artifact@v4. Note: v3 and v4 artifacts are incompatible.",
            relatedError: "caching-artifacts-004",
          });
        }
        if (step.uses.match(/actions\/download-artifact@v3/)) {
          findings.push({
            severity: "high",
            message: `Step uses actions/download-artifact@v3 — v4 is current.`,
            fix: "Upgrade to actions/download-artifact@v4. Ensure upload and download versions match.",
          });
        }
      }

      // if: with pipe scalar
      if (step.if && typeof step.if === "string") {
        if (step.if.trim().startsWith("|\n") || step.if.trim().startsWith("|")) {
          findings.push({
            severity: "medium",
            message: `Step '${step.name ?? "unnamed"}' if: condition uses pipe scalar — will always be true.`,
            fix: "Remove the pipe character. Write the condition on a single line.",
            relatedError: "yaml-syntax-007",
          });
        }

        // Secrets in if conditions
        if (step.if.includes("secrets.")) {
          findings.push({
            severity: "medium",
            message: `Step '${step.name ?? "unnamed"}' uses secrets.* in if: condition — secrets context is not available in if:.`,
            fix: "Pass the secret to an env var first, then check the env var in the if: condition.",
            relatedError: "yaml-syntax-005",
          });
        }
      }
    }
  }

  return findings;
}

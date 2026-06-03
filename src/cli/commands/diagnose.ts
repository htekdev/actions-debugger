/**
 * CLI command: diagnose — analyze a workflow YAML file for common issues.
 */

import { readFileSync } from "node:fs";
import type { Command } from "commander";
import { loadErrorDatabase } from "../../db/loader.js";
import { diagnoseWorkflow } from "../../tools/diagnose-workflow.js";
import { detectFormat, formatDiagnoseOutput } from "../output.js";

export function registerDiagnoseCommand(program: Command): void {
  program
    .command("diagnose <file>")
    .description("Analyze a workflow YAML file for common issues")
    .option("--format <fmt>", "Output format: text, json, md")
    .action(async (file: string, opts: { format?: string }) => {
      try {
        let yaml: string;

        if (file === "-") {
          // Read from stdin
          yaml = await readStdin();
        } else {
          try {
            yaml = readFileSync(file, "utf-8");
          } catch {
            console.error(`Error: Cannot read file '${file}'`);
            process.exit(2);
          }
        }

        const db = await loadErrorDatabase();
        const findings = diagnoseWorkflow(db, yaml);
        const format = detectFormat(opts.format);
        console.log(formatDiagnoseOutput(findings, format));
        process.exit(findings.length > 0 ? 0 : 0); // 0 even if findings (analysis success)
      } catch (err) {
        console.error(`Error: ${(err as Error).message}`);
        process.exit(3);
      }
    });
}

/**
 * Read all data from stdin.
 */
function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    process.stdin.on("data", (chunk) => chunks.push(chunk));
    process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    process.stdin.on("error", reject);

    // If stdin is a TTY (no pipe), show a hint and wait briefly
    if (process.stdin.isTTY) {
      console.error("Reading workflow YAML from stdin... (Ctrl+D to end)");
    }
  });
}

/**
 * Validate all error YAML files against the schema.
 * Run with: npm run validate-errors
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { globSync } from "glob";
import yaml from "js-yaml";

const __dirname = dirname(fileURLToPath(import.meta.url));
const errorsDir = resolve(__dirname, "..", "errors");

interface ErrorEntry {
  id: string;
  title: string;
  category: string;
  severity: string;
  patterns: Array<{ regex: string; flags?: string }>;
  root_cause: string;
  fix: string;
  [key: string]: unknown;
}

const VALID_CATEGORIES = [
  "yaml-syntax",
  "silent-failures",
  "runner-environment",
  "permissions-auth",
  "caching-artifacts",
  "triggers",
  "concurrency-timing",
  "known-unsolved",
];

const VALID_SEVERITIES = ["error", "warning", "silent-failure", "limitation"];

let errors = 0;
let validated = 0;

const yamlFiles = globSync("**/*.yml", { cwd: errorsDir, absolute: true });

if (yamlFiles.length === 0) {
  console.error("❌ No YAML files found in errors/");
  process.exit(1);
}

for (const file of yamlFiles) {
  const relativePath = file.replace(errorsDir, "errors");
  try {
    const content = readFileSync(file, "utf-8");
    const entry = yaml.load(content) as ErrorEntry;

    // Required fields
    for (const field of ["id", "title", "category", "severity", "patterns", "root_cause", "fix"]) {
      if (!entry[field]) {
        console.error(`❌ ${relativePath}: Missing required field '${field}'`);
        errors++;
      }
    }

    // ID format
    if (entry.id && !/^[a-z-]+-\d{3}$/.test(entry.id)) {
      console.error(`❌ ${relativePath}: ID '${entry.id}' doesn't match pattern {category}-{NNN}`);
      errors++;
    }

    // Category validation
    if (entry.category && !VALID_CATEGORIES.includes(entry.category)) {
      console.error(`❌ ${relativePath}: Invalid category '${entry.category}'`);
      errors++;
    }

    // Severity validation
    if (entry.severity && !VALID_SEVERITIES.includes(entry.severity)) {
      console.error(`❌ ${relativePath}: Invalid severity '${entry.severity}'`);
      errors++;
    }

    // Pattern regex validation
    if (Array.isArray(entry.patterns)) {
      for (const pattern of entry.patterns) {
        if (!pattern.regex) {
          console.error(`❌ ${relativePath}: Pattern missing 'regex' field`);
          errors++;
          continue;
        }
        try {
          new RegExp(pattern.regex, pattern.flags ?? "i");
        } catch (e) {
          console.error(`❌ ${relativePath}: Invalid regex '${pattern.regex}': ${(e as Error).message}`);
          errors++;
        }

        // Basic safety check
        if (pattern.regex.length > 500) {
          console.error(`❌ ${relativePath}: Regex too long (${pattern.regex.length} chars, max 500)`);
          errors++;
        }
      }
    }

    validated++;
    console.log(`✅ ${relativePath} — ${entry.id}`);
  } catch (e) {
    console.error(`❌ ${relativePath}: YAML parse error: ${(e as Error).message}`);
    errors++;
  }
}

console.log(`\n${validated} files validated, ${errors} error(s)`);

if (errors > 0) {
  process.exit(1);
}

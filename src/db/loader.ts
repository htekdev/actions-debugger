/**
 * YAML error database loader.
 * Reads all YAML files from errors/ directory and builds an in-memory database.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { globSync } from "glob";
import yaml from "js-yaml";
import type { ErrorEntry, ErrorDatabase, ErrorCategory } from "./types.js";

/**
 * Load the error database from YAML files.
 * @param errorsDir - Optional custom path to errors directory
 * @returns Populated ErrorDatabase
 */
export async function loadErrorDatabase(errorsDir?: string): Promise<ErrorDatabase> {
  const dir = errorsDir ?? findErrorsDir();

  if (!existsSync(dir)) {
    throw new Error(`Errors directory not found: ${dir}`);
  }

  const yamlFiles = globSync("**/*.yml", { cwd: dir, absolute: true });
  const entries: ErrorEntry[] = [];

  for (const file of yamlFiles) {
    // Skip schema file
    if (basename(file) === "_schema.json") continue;

    try {
      const content = readFileSync(file, "utf-8");
      const entry = yaml.load(content) as ErrorEntry;

      // Basic validation
      if (!entry.id || !entry.title || !entry.category) {
        console.warn(`Skipping invalid entry: ${file} (missing required fields)`);
        continue;
      }

      entries.push(entry);
    } catch (err) {
      console.warn(`Failed to parse ${file}: ${(err as Error).message}`);
    }
  }

  // Build indexes
  const categories = new Map<ErrorCategory, ErrorEntry[]>();
  const byId = new Map<string, ErrorEntry>();

  for (const entry of entries) {
    byId.set(entry.id, entry);

    const catEntries = categories.get(entry.category) ?? [];
    catEntries.push(entry);
    categories.set(entry.category, catEntries);
  }

  return { entries, categories, byId };
}

/**
 * Find the errors directory relative to this file or the package root.
 */
function findErrorsDir(): string {
  // When running from source (src/db/loader.ts)
  const thisFile = fileURLToPath(import.meta.url);
  const srcDir = dirname(dirname(thisFile));
  const rootDir = dirname(srcDir);

  // Check for errors/ at package root
  const candidate = resolve(rootDir, "errors");
  if (existsSync(candidate)) {
    return candidate;
  }

  // When installed as npm package, errors/ is in the package
  const npmCandidate = resolve(rootDir, "..", "errors");
  if (existsSync(npmCandidate)) {
    return npmCandidate;
  }

  // Fallback: look relative to cwd
  const cwdCandidate = resolve(process.cwd(), "errors");
  if (existsSync(cwdCandidate)) {
    return cwdCandidate;
  }

  throw new Error(
    "Could not find errors directory. Set ACTIONS_DEBUGGER_ERRORS_DIR or pass errorsDir to loadErrorDatabase()."
  );
}

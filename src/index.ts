#!/usr/bin/env node

/**
 * @htekdev/actions-debugger — MCP server entry point.
 *
 * 65+ real GitHub Actions errors, queryable by agents.
 * Runs as a stdio MCP server for Claude Desktop, Copilot CLI, Cursor, etc.
 *
 * Usage:
 *   npx @htekdev/actions-debugger
 *
 * Source: https://htek.dev/articles/github-actions-debugging-guide
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadErrorDatabase } from "./db/loader.js";
import { registerTools } from "./server.js";

// Re-export programmatic API
export { loadErrorDatabase } from "./db/loader.js";
export { lookupError } from "./tools/lookup-error.js";
export { diagnoseWorkflow } from "./tools/diagnose-workflow.js";
export { suggestFix } from "./tools/suggest-fix.js";
export { listCategories } from "./tools/list-categories.js";
export { searchErrors } from "./tools/search-errors.js";
export type {
  ErrorEntry,
  ErrorDatabase,
  ErrorCategory,
  ErrorSeverity,
  SearchResult,
  DiagnosticFinding,
  CategoryInfo,
} from "./db/types.js";

/**
 * Start the MCP server if running as CLI.
 */
async function main(): Promise<void> {
  const db = await loadErrorDatabase();

  const server = new Server(
    { name: "actions-debugger", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  registerTools(server, db);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Only start server when running as CLI (not when imported as library)
const isMainModule =
  process.argv[1] &&
  (process.argv[1].endsWith("index.js") ||
    process.argv[1].endsWith("actions-debugger"));

if (isMainModule) {
  main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}

/**
 * @htekdev/actions-debugger — Programmatic API exports.
 *
 * 65+ real GitHub Actions errors, queryable by agents.
 *
 * For MCP server: import from "@htekdev/actions-debugger/mcp"
 * For CLI: npx @htekdev/actions-debugger <command>
 * For library: import { lookupError, searchErrors } from "@htekdev/actions-debugger"
 *
 * Source: https://htek.dev/articles/github-actions-debugging-guide
 */

// Core API exports
export { loadErrorDatabase } from "./db/loader.js";
export { lookupError } from "./tools/lookup-error.js";
export { diagnoseWorkflow } from "./tools/diagnose-workflow.js";
export { suggestFix } from "./tools/suggest-fix.js";
export { listCategories } from "./tools/list-categories.js";
export { searchErrors } from "./tools/search-errors.js";

// Type exports
export type {
  ErrorEntry,
  ErrorDatabase,
  ErrorCategory,
  ErrorSeverity,
  SearchResult,
  DiagnosticFinding,
  CategoryInfo,
} from "./db/types.js";


#!/usr/bin/env node

/**
 * Unified entry point for @htekdev/actions-debugger.
 *
 * Detection logic:
 * - Known subcommand (lookup, search, diagnose, suggest-fix, categories) → CLI mode
 * - --help, --version, or flag starting with - → CLI mode (commander handles it)
 * - No args or --mcp → MCP server mode (backward compatible)
 * - Unknown arg → MCP server mode (fallback)
 */

const CLI_COMMANDS = ["lookup", "search", "diagnose", "suggest-fix", "categories"];

const firstArg = process.argv[2];

if (!firstArg || firstArg === "--mcp") {
  // MCP server mode — dynamic import to keep startup fast for CLI
  import("./mcp.js");
} else if (
  CLI_COMMANDS.includes(firstArg) ||
  firstArg === "--help" ||
  firstArg === "-h" ||
  firstArg === "--version" ||
  firstArg === "-V"
) {
  // CLI mode
  import("./cli/main.js");
} else {
  // Unknown arg — fallback to MCP for backward compat
  import("./mcp.js");
}

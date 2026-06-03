#!/usr/bin/env node

/**
 * MCP server entry point.
 * Starts the stdio MCP server for Claude Desktop, Copilot CLI, Cursor, etc.
 *
 * Usage:
 *   npx @htekdev/actions-debugger       (no subcommand → MCP mode)
 *   node dist/mcp.js
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadErrorDatabase } from "./db/loader.js";
import { registerTools } from "./server.js";

async function main(): Promise<void> {
  const db = await loadErrorDatabase();

  const server = new Server(
    { name: "actions-debugger", version: "1.1.0" },
    { capabilities: { tools: {} } }
  );

  registerTools(server, db);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

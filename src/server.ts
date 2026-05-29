/**
 * MCP Server setup — registers all tools with the MCP server.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { ErrorDatabase, ErrorCategory } from "./db/types.js";
import { lookupError, formatLookupResult } from "./tools/lookup-error.js";
import { diagnoseWorkflow, formatDiagnosticResult } from "./tools/diagnose-workflow.js";
import { suggestFix, formatSuggestResult } from "./tools/suggest-fix.js";
import { listCategories, formatCategoryList } from "./tools/list-categories.js";
import { searchErrors, formatSearchResult } from "./tools/search-errors.js";

const CATEGORIES: ErrorCategory[] = [
  "yaml-syntax",
  "silent-failures",
  "runner-environment",
  "permissions-auth",
  "caching-artifacts",
  "triggers",
  "concurrency-timing",
  "known-unsolved",
];

const TOOLS = [
  {
    name: "lookup_error",
    description:
      "Match a GitHub Actions error message against the known error database. Returns matching errors with root cause and fix.",
    inputSchema: {
      type: "object" as const,
      required: ["error_message"],
      properties: {
        error_message: {
          type: "string",
          description: "The error message from GitHub Actions logs",
        },
        max_results: {
          type: "number",
          description: "Maximum results to return (default: 3)",
        },
      },
    },
  },
  {
    name: "diagnose_workflow",
    description:
      "Analyze a GitHub Actions workflow YAML for common issues. Returns a list of potential problems with severity and fixes.",
    inputSchema: {
      type: "object" as const,
      required: ["workflow_yaml"],
      properties: {
        workflow_yaml: {
          type: "string",
          description: "The workflow YAML content to analyze",
        },
      },
    },
  },
  {
    name: "suggest_fix",
    description:
      "Given error context (error message, workflow snippet, runner OS), suggest the most likely fix with code examples.",
    inputSchema: {
      type: "object" as const,
      required: ["error_context"],
      properties: {
        error_context: {
          type: "string",
          description:
            "Description of the problem — error message, what you're trying to do, runner OS, etc.",
        },
        category: {
          type: "string",
          description: "Error category to narrow search (optional)",
          enum: CATEGORIES,
        },
      },
    },
  },
  {
    name: "list_categories",
    description: "List all error categories with error counts and descriptions.",
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    name: "search_errors",
    description: "Search the error database by keyword, tag, or category.",
    inputSchema: {
      type: "object" as const,
      required: ["query"],
      properties: {
        query: {
          type: "string",
          description:
            "Search query — matches against title, root_cause, fix, tags",
        },
        category: {
          type: "string",
          description: "Filter by category (optional)",
          enum: CATEGORIES,
        },
        severity: {
          type: "string",
          description: "Filter by severity (optional)",
          enum: ["error", "warning", "silent-failure", "limitation"],
        },
        max_results: {
          type: "number",
          description: "Maximum results to return (default: 10)",
        },
      },
    },
  },
];

/**
 * Register all tools with the MCP server.
 */
export function registerTools(server: Server, db: ErrorDatabase): void {
  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "lookup_error": {
        const { error_message, max_results } = args as {
          error_message: string;
          max_results?: number;
        };
        const results = lookupError(db, error_message, max_results ?? 3);
        return {
          content: [{ type: "text", text: formatLookupResult(results) }],
        };
      }

      case "diagnose_workflow": {
        const { workflow_yaml } = args as { workflow_yaml: string };
        const findings = diagnoseWorkflow(db, workflow_yaml);
        return {
          content: [{ type: "text", text: formatDiagnosticResult(findings) }],
        };
      }

      case "suggest_fix": {
        const { error_context, category } = args as {
          error_context: string;
          category?: string;
        };
        const results = suggestFix(db, error_context, category);
        return {
          content: [{ type: "text", text: formatSuggestResult(results) }],
        };
      }

      case "list_categories": {
        const categories = listCategories(db);
        return {
          content: [{ type: "text", text: formatCategoryList(categories) }],
        };
      }

      case "search_errors": {
        const { query, category, severity, max_results } = args as {
          query: string;
          category?: string;
          severity?: string;
          max_results?: number;
        };
        const results = searchErrors(db, query, {
          category,
          severity,
          maxResults: max_results ?? 10,
        });
        return {
          content: [{ type: "text", text: formatSearchResult(results) }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });
}

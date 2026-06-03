# @htekdev/actions-debugger

[![CI](https://github.com/htekdev/actions-debugger/actions/workflows/ci.yml/badge.svg)](https://github.com/htekdev/actions-debugger/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@htekdev/actions-debugger)](https://www.npmjs.com/package/@htekdev/actions-debugger)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> 65+ real GitHub Actions errors, queryable by agents. CLI + MCP server + Copilot skills + error database.

**Stop debugging the same CI failures over and over.** This repo packages 65+ real-world GitHub Actions error scenarios — with regex-matchable patterns, root causes, and copy-paste fixes — into formats that both humans and AI agents can consume.

## What's Inside

```
errors/              → Structured YAML error database (65+ entries)
src/                 → CLI + MCP server (TypeScript)
.github/skills/      → Copilot CLI skills for CI debugging
.github/agents/      → Copilot agent definition
```

## Quick Start

### CLI (Zero Install)

```bash
# Look up an error
npx @htekdev/actions-debugger lookup "Permission to org/repo.git denied"

# Search by keyword
npx @htekdev/actions-debugger search "OIDC" --category permissions-auth

# Diagnose a workflow file
npx @htekdev/actions-debugger diagnose .github/workflows/ci.yml

# Get fix suggestions
npx @htekdev/actions-debugger suggest-fix "artifact upload fails intermittently"

# List all categories
npx @htekdev/actions-debugger categories
```

#### Output Formats

```bash
# Text (default for TTY)
npx @htekdev/actions-debugger lookup "error message"

# JSON (default when piped, or explicit)
npx @htekdev/actions-debugger lookup "error message" --format json

# Markdown
npx @htekdev/actions-debugger lookup "error message" --format md
```

#### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success / matches found |
| 1 | No matches found |
| 2 | Invalid input / parse error |
| 3 | Database load error |

### As an MCP Server (Claude Desktop, Copilot CLI, Cursor, etc.)

```bash
npx @htekdev/actions-debugger
```

Add to your MCP client config:

```json
{
  "mcpServers": {
    "actions-debugger": {
      "command": "npx",
      "args": ["@htekdev/actions-debugger"]
    }
  }
}
```

**Client config locations:**
- **Claude Desktop**: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) / `%APPDATA%\Claude\claude_desktop_config.json` (Windows)
- **Cursor**: `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global)
- **VS Code (Copilot Chat)**: `.vscode/mcp.json`
- **Copilot CLI**: `.github/mcp.json` (repo-level)
- **Windsurf**: `~/.codeium/windsurf/mcp_config.json`

### As a Copilot CLI Skill (No MCP Required)

Copy `.github/skills/actions-debugging-cli/SKILL.md` to your repo's `.github/skills/` directory. Any agent with shell access can use the CLI — no MCP config needed.

```markdown
> **Skill reference:** For CI debugging, use the `actions-debugging-cli` skill.
```

### Programmatic (npm Package)

```typescript
import { loadErrorDatabase, lookupError, diagnoseWorkflow } from "@htekdev/actions-debugger";

const db = await loadErrorDatabase();

// Lookup by error message
const matches = lookupError(db, "Permission to org/repo.git denied");
console.log(matches[0].fix);

// Analyze a workflow
const issues = diagnoseWorkflow(db, workflowYamlString);
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `lookup_error` | Match an error message against 65+ known issues |
| `diagnose_workflow` | Static analysis of workflow YAML for common mistakes |
| `suggest_fix` | Contextual fix suggestions from error context |
| `search_errors` | Full-text search by keyword, category, severity |
| `list_categories` | Browse error categories with counts |

## Error Categories

| Category | Description |
|----------|-------------|
| `yaml-syntax` | YAML validation, key typos, expression errors |
| `silent-failures` | No error shown, but wrong behavior |
| `runner-environment` | Runner issues, disk space, Docker, PATH |
| `permissions-auth` | GITHUB_TOKEN, OIDC, secrets, 403s |
| `caching-artifacts` | Cache misses, artifact v4 changes, corruption |
| `triggers` | Workflow not running, cron issues, dispatch |
| `concurrency-timing` | Job cancellation, matrix, timeouts |
| `known-unsolved` | Platform limitations with no fix |

## Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for how to add new error entries. It's easy:

1. Create a YAML file in the appropriate `errors/{category}/` directory
2. Follow the schema in `errors/_schema.json`
3. Open a PR — CI validates your entry automatically

## Source

All error scenarios sourced from: **[The Definitive GitHub Actions Debugging Guide](https://htek.dev/articles/github-actions-debugging-guide)**

## License

MIT — [Hector Flores](https://htek.dev) (htekdev)

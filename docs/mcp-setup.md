# MCP Server Setup

The `@htekdev/actions-debugger` MCP server exposes 5 tools for querying the error database via the Model Context Protocol.

## Installation

```bash
npm install -g @htekdev/actions-debugger
```

Or use `npx` (no install needed):

```bash
npx @htekdev/actions-debugger
```

## Client Configuration

### Claude Desktop

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

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

### Cursor

**Project-level:** `.cursor/mcp.json`
**Global:** `~/.cursor/mcp.json`

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

### VS Code (Copilot Chat)

**Project-level:** `.vscode/mcp.json`

```json
{
  "servers": {
    "actions-debugger": {
      "command": "npx",
      "args": ["@htekdev/actions-debugger"]
    }
  }
}
```

### GitHub Copilot CLI

**Repo-level:** `.github/mcp.json`

```json
{
  "servers": {
    "actions-debugger": {
      "command": "npx",
      "args": ["@htekdev/actions-debugger"]
    }
  }
}
```

### Docker

```bash
docker run -i ghcr.io/htekdev/actions-debugger:latest
```

```json
{
  "mcpServers": {
    "actions-debugger": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "ghcr.io/htekdev/actions-debugger:latest"]
    }
  }
}
```

## Available Tools

### `lookup_error`
Match a GitHub Actions error message against the known error database.

**Input:**
- `error_message` (string, required) — The error message from CI logs
- `max_results` (number, optional) — Maximum results (default: 3)

### `diagnose_workflow`
Analyze a workflow YAML for common issues.

**Input:**
- `workflow_yaml` (string, required) — The workflow YAML content

### `suggest_fix`
Contextual fix suggestions from error description.

**Input:**
- `error_context` (string, required) — Description of the problem
- `category` (string, optional) — Error category to narrow search

### `search_errors`
Full-text search across the error database.

**Input:**
- `query` (string, required) — Search query
- `category` (string, optional) — Filter by category
- `severity` (string, optional) — Filter by severity
- `max_results` (number, optional) — Max results (default: 10)

### `list_categories`
List all error categories with counts.

No input required.

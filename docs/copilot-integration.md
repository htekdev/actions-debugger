# Copilot CLI Integration

Integrate the Actions Debugger with GitHub Copilot CLI for CI/CD debugging directly in your terminal.

## Option A: MCP Server (Recommended)

Add the MCP server to your repo's `.github/mcp.json`:

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

Your Copilot CLI agent can now call these tools:
- `lookup_error(error_message)` — Match against 65+ known issues
- `diagnose_workflow(workflow_yaml)` — Static analysis for common mistakes
- `suggest_fix(error_context)` — Contextual fix with code examples
- `search_errors(query)` — Search by keyword/category/severity
- `list_categories()` — Browse error categories

## Option B: Skill Reference (No MCP)

Copy the skill files to your repo:

```bash
# Copy the debugging skill
cp -r .github/skills/actions-debugging/ /your-repo/.github/skills/

# Copy the validator skill (optional)
cp -r .github/skills/workflow-validator/ /your-repo/.github/skills/
```

Reference in your agent definition:

```markdown
> **Skill reference:** For CI debugging, use the `actions-debugging` skill.
> **Skill reference:** For workflow validation, use the `workflow-validator` skill.
```

## Option C: Agent Definition

Copy `.github/agents/actions-debugger.agent.md` to your repo. This creates a specialist agent that users can invoke for CI debugging.

## Example Usage

```
User: My CI workflow is failing with "Permission to htekdev/my-repo.git denied"

Agent (using lookup_error):
## GITHUB_TOKEN Permission Denied (403)
**Root Cause:** Default GITHUB_TOKEN is read-only since Feb 2023.
**Fix:**
```yaml
permissions:
  contents: write
```
```

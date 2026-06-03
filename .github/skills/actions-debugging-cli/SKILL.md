---
name: actions-debugging-cli
description: >
  GitHub Actions CI/CD debugging via CLI — look up errors, diagnose workflows,
  and search 65+ known issues. Use when agent sees "Actions error", "CI failed",
  "workflow broken", "debug Actions", "why did my build fail", or any CI/CD
  debugging. Requires: npx @htekdev/actions-debugger (zero install).
---

# Actions Debugging CLI

## Quick Start

No installation needed. Run via npx:

```bash
npx @htekdev/actions-debugger lookup "your error message here"
```

## Commands

### Lookup an error message
```bash
npx @htekdev/actions-debugger lookup "<exact error text from logs>"
```
Returns: matching known errors with root cause, fix, and prevention steps.

### Search by keyword
```bash
npx @htekdev/actions-debugger search "<keyword>" [--category <cat>] [--severity <sev>]
```
Categories: yaml-syntax, silent-failures, runner-environment, permissions-auth,
caching-artifacts, triggers, concurrency-timing, known-unsolved

### Diagnose a workflow file
```bash
npx @htekdev/actions-debugger diagnose .github/workflows/<file>.yml
```
Returns: static analysis findings with severity and fixes.

### Get fix suggestions
```bash
npx @htekdev/actions-debugger suggest-fix "<describe the problem>"
```

### List all categories
```bash
npx @htekdev/actions-debugger categories
```

## Workflow for Agents

1. Extract the error message from CI logs (exact text, not paraphrased)
2. Run `lookup` with the exact error text
3. If no match, try `search` with key terms from the error
4. If workflow-level issues suspected, run `diagnose` on the workflow file
5. For ambiguous situations, use `suggest-fix` with full context

## Output Formats

Add `--format json` for structured output (easier to parse programmatically):
```bash
npx @htekdev/actions-debugger lookup "error" --format json
```

JSON output schema:
```json
{
  "matches": [{
    "id": "string",
    "title": "string",
    "category": "string",
    "severity": "error|warning|silent-failure|limitation",
    "root_cause": "string",
    "fix": "string",
    "fix_code": [{"language": "string", "code": "string"}],
    "prevention": ["string"],
    "docs": [{"label": "string", "url": "string"}],
    "tags": ["string"]
  }]
}
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success, matches found |
| 1 | No matches found |
| 2 | Invalid input / parse error |
| 3 | Database load error |

## Tips

- Use `--format json` when you need to parse output programmatically
- Pipe workflow files: `cat .github/workflows/ci.yml | npx @htekdev/actions-debugger diagnose -`
- Combine with jq: `npx @htekdev/actions-debugger search "token" --format json | jq '.matches[].fix'`
- Auto-format: text when TTY, json when piped (override with `--format`)
- `--max-results <n>` limits output for lookup and search commands

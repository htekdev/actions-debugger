---
name: actions-debugging
description: >
  GitHub Actions error lookup — match error messages against a database of 65+ known
  issues with root causes and fixes. Use when agent sees "Actions error", "CI failed",
  "workflow broken", "debug Actions", "why did my build fail", "GitHub Actions help",
  or any CI/CD debugging activity.
---

# Actions Debugging Skill

## Purpose
Match GitHub Actions error messages against a curated database of 65+ known errors.
Every entry includes the error pattern, root cause, and copy-paste fix.

## When to Use
- Agent encounters a GitHub Actions error message in logs
- User asks for help debugging a CI/CD failure
- Workflow analysis reveals potential issues

## Error Categories
1. **yaml-syntax** — YAML validation, key typos, expression errors
2. **silent-failures** — No error shown, but wrong behavior
3. **runner-environment** — Runner issues, disk space, Docker, PATH
4. **permissions-auth** — GITHUB_TOKEN, OIDC, secrets, 403s
5. **caching-artifacts** — Cache misses, artifact v4 changes, corruption
6. **triggers** — Workflow not running, cron issues, dispatch
7. **concurrency-timing** — Job cancellation, matrix, timeouts
8. **known-unsolved** — Platform limitations with no fix

## Lookup Procedure
1. Extract the error message from the CI logs
2. Search the error database (MCP `lookup_error` if available, or pattern match against known errors)
3. If match found: return root cause + fix + prevention steps + doc links
4. If no match: suggest enabling debug logging and checking the Essential Tooling section

## Quick Reference — Top 10 Most Common

| # | Error Pattern | Category | Fix Summary |
|---|--------------|----------|-------------|
| 1 | `Permission to org/repo.git denied` | permissions-auth | Add `permissions: contents: write` |
| 2 | `Cache not found for input keys` | caching-artifacts | Check branch scoping, rate limits |
| 3 | `Unexpected value 'X'` | yaml-syntax | Fix key casing (`default:` → `defaults:`) |
| 4 | `No space left on device` | runner-environment | Add `jlumbroso/free-disk-space` |
| 5 | Workflow never appears in Actions tab | triggers | Check file is on default branch |
| 6 | `set-output command is deprecated` | runner-environment | Use `>> $GITHUB_OUTPUT` |
| 7 | `Node.js 16 actions are deprecated` | runner-environment | Bump action versions |
| 8 | Step `if:` always evaluates to true | yaml-syntax | Remove pipe scalar / trailing spaces |
| 9 | Scheduled workflow stops after 60 days | silent-failures | Add keepalive-workflow action |
| 10 | `GITHUB_TOKEN` commit doesn't trigger | silent-failures | Use GitHub App token or PAT |

## MCP Server
If the `actions-debugger` MCP server is available, use these tools for programmatic lookup:
- `lookup_error(error_message)` — Match against known patterns
- `diagnose_workflow(workflow_yaml)` — Static analysis
- `suggest_fix(error_context)` — Contextual suggestions
- `search_errors(query)` — Full-text search
- `list_categories()` — Browse categories

## Source
Full reference: https://htek.dev/articles/github-actions-debugging-guide

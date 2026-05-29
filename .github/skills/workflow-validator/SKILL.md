---
name: workflow-validator
description: >
  GitHub Actions workflow YAML validator — static analysis for common mistakes before
  pushing. Use when agent says "validate workflow", "check my workflow", "review YAML",
  "workflow lint", "is this workflow correct", "pre-push check", or any workflow
  validation activity.
---

# Workflow Validator Skill

## Purpose
Analyze GitHub Actions workflow YAML for common mistakes that would cause failures
or silent misbehavior. This is the agent-side complement to `actionlint`.

## Validation Checks

### Critical (Will Fail)
- [ ] Missing `runs-on` on any job
- [ ] Missing `shell:` on composite action `run:` steps
- [ ] Tab characters used for indentation
- [ ] Double quotes in `${{ }}` expressions (must use single quotes)
- [ ] `workflow_dispatch:` nested under another trigger instead of sibling

### High (Likely to Fail)
- [ ] No `permissions:` block (defaults are read-only since Feb 2023)
- [ ] Using `actions/upload-artifact@v3` with `@v4` download (incompatible backends)
- [ ] `set-output` or `set-env` deprecated commands in `run:` steps
- [ ] `secrets.*` used directly in `if:` conditions

### Medium (May Cause Issues)
- [ ] No `timeout-minutes` on jobs (default is 6 hours)
- [ ] `if: | ${{ ... }}` pipe scalar (always true)
- [ ] Concurrency group without branch isolation
- [ ] `hashFiles()` with patterns that may match nothing
- [ ] `cache-hit == 'false'` instead of `!= 'true'`

### Low (Best Practice)
- [ ] Missing `fail-fast: false` on diagnostic matrix builds
- [ ] Not using `actions/create-github-app-token` for cross-repo access
- [ ] Missing `.editorconfig` with `indent_style = space` for YAML files

## Procedure
1. Parse the workflow YAML
2. Run each check against the parsed structure
3. Return findings grouped by severity
4. Include fix code snippets for each finding

## MCP Server
If the `actions-debugger` MCP server is available:
- `diagnose_workflow(workflow_yaml)` — runs all checks programmatically

## Source
Full reference: https://htek.dev/articles/github-actions-debugging-guide

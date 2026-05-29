# Contributing to Actions Debugger

Thanks for helping expand the error database! Every new entry helps developers and AI agents debug CI failures faster.

## Adding a New Error Entry

### 1. Create a YAML File

Add a new `.yml` file in the appropriate category directory under `errors/`:

```
errors/
├── yaml-syntax/          # YAML validation, key typos, expression errors
├── silent-failures/      # No error shown, but wrong behavior
├── runner-environment/   # Runner issues, disk space, Docker, PATH
├── permissions-auth/     # GITHUB_TOKEN, OIDC, secrets, 403s
├── caching-artifacts/    # Cache misses, artifact v4 changes
├── triggers/             # Workflow not running, cron issues
├── concurrency-timing/   # Job cancellation, matrix, timeouts
└── known-unsolved/       # Platform limitations with no fix
```

### 2. Follow the Schema

Each YAML file must include these required fields:

```yaml
id: category-NNN           # e.g., yaml-syntax-011
title: "Human-readable title"
category: yaml-syntax       # Must match directory name
severity: error             # error | warning | silent-failure | limitation
tags:
  - relevant
  - keywords

patterns:
  - regex: "the error pattern to match"
    flags: "i"              # Optional, defaults to "i" (case-insensitive)

error_messages:
  - "Exact error string from CI logs"

root_cause: |
  Why this error happens. Be specific and technical.

fix: |
  How to fix it. Include step-by-step if needed.

fix_code:
  - language: yaml
    label: "Description of the fix"
    code: |
      actual:
        code: here

prevention:
  - "How to prevent this in the future"

docs:
  - url: "https://docs.github.com/relevant-page"
    label: "Official documentation"

source:
  article: "https://htek.dev/articles/github-actions-debugging-guide"
  section: "Section Name"
```

### 3. ID Format

IDs follow the pattern `{category}-{NNN}`:
- `yaml-syntax-011`
- `permissions-auth-008`
- `caching-artifacts-011`

Check existing files in the category to find the next available number.

### 4. Regex Pattern Guidelines

Patterns are matched against CI log output. Keep them:

- **Simple** — avoid complex lookaheads/lookbehinds
- **Anchored where possible** — use `^` or word boundaries
- **Short** — max 500 characters
- **Safe** — no catastrophic backtracking patterns like `(.*)+`
- **Tested** — verify your regex matches real CI log output

### 5. Submit a PR

1. Fork the repo
2. Create your YAML file(s)
3. Run `npm run validate-errors` to check your entries
4. Open a PR with a description of the error scenario

CI will automatically validate your entry against the schema.

## Running Locally

```bash
npm install
npm run validate-errors  # Validate error database
npm test                 # Run all tests
npm run lint             # Type-check
```

## Questions?

Open an issue or check the [full guide](https://htek.dev/articles/github-actions-debugging-guide) for context.

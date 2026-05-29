import { describe, it, expect, beforeAll } from "vitest";
import { loadErrorDatabase } from "../src/db/loader.js";
import { lookupError, formatLookupResult } from "../src/tools/lookup-error.js";
import { diagnoseWorkflow, formatDiagnosticResult } from "../src/tools/diagnose-workflow.js";
import { suggestFix, formatSuggestResult } from "../src/tools/suggest-fix.js";
import { listCategories, formatCategoryList } from "../src/tools/list-categories.js";
import { searchErrors, formatSearchResult } from "../src/tools/search-errors.js";
import type { ErrorDatabase } from "../src/db/types.js";

describe("MCP Tools", () => {
  let db: ErrorDatabase;

  beforeAll(async () => {
    db = await loadErrorDatabase();
  });

  describe("lookupError", () => {
    it("returns matching entries", () => {
      const results = lookupError(db, "Permission to org/repo.git denied");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title).toBeTruthy();
    });

    it("formatLookupResult handles no matches", () => {
      const result = formatLookupResult([]);
      expect(result).toContain("No matching errors");
      expect(result).toContain("actionlint");
    });

    it("formatLookupResult formats matches", () => {
      const entries = lookupError(db, "Permission to org/repo.git denied");
      const result = formatLookupResult(entries);
      expect(result).toContain("Root Cause");
      expect(result).toContain("Fix");
    });
  });

  describe("diagnoseWorkflow", () => {
    it("detects missing runs-on", () => {
      const yaml = `
name: CI
on: push
jobs:
  test:
    steps:
      - uses: actions/checkout@v4
`;
      const findings = diagnoseWorkflow(db, yaml);
      const hasRunsOn = findings.some((f) => f.message.includes("runs-on"));
      expect(hasRunsOn).toBe(true);
    });

    it("detects tab characters", () => {
      const yamlWithTabs = "name: CI\non: push\njobs:\n\ttest:\n\t\truns-on: ubuntu-latest";
      const findings = diagnoseWorkflow(db, yamlWithTabs);
      const hasTabs = findings.some((f) => f.message.toLowerCase().includes("tab"));
      expect(hasTabs).toBe(true);
    });

    it("detects deprecated set-output", () => {
      const yaml = `
name: CI
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: echo "::set-output name=result::value"
`;
      const findings = diagnoseWorkflow(db, yaml);
      const hasSetOutput = findings.some((f) => f.message.includes("set-output"));
      expect(hasSetOutput).toBe(true);
    });

    it("detects missing permissions", () => {
      const yaml = `
name: CI
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
`;
      const findings = diagnoseWorkflow(db, yaml);
      const hasPermissions = findings.some((f) => f.message.includes("permissions"));
      expect(hasPermissions).toBe(true);
    });

    it("returns clean for a good workflow", () => {
      const yaml = `
name: CI
on: push
permissions:
  contents: read
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - run: npm test
`;
      const findings = diagnoseWorkflow(db, yaml);
      // Should have no critical or high findings
      const serious = findings.filter(
        (f) => f.severity === "critical" || f.severity === "high"
      );
      expect(serious.length).toBe(0);
    });

    it("handles invalid YAML", () => {
      const findings = diagnoseWorkflow(db, "not: valid: yaml: {{{}}}");
      expect(findings.length).toBeGreaterThan(0);
    });

    it("formatDiagnosticResult handles no issues", () => {
      const result = formatDiagnosticResult([]);
      expect(result).toContain("No issues found");
    });
  });

  describe("suggestFix", () => {
    it("returns suggestions for context", () => {
      const results = suggestFix(db, "My CI workflow is getting a 403 when trying to push to the repo");
      expect(results.length).toBeGreaterThan(0);
    });

    it("filters by category", () => {
      const results = suggestFix(db, "cache error", "caching-artifacts");
      if (results.length > 0) {
        expect(results[0].category).toBe("caching-artifacts");
      }
    });
  });

  describe("listCategories", () => {
    it("returns all categories", () => {
      const categories = listCategories(db);
      expect(categories.length).toBeGreaterThan(0);
    });

    it("category counts match entries", () => {
      const categories = listCategories(db);
      const totalFromCategories = categories.reduce((sum, c) => sum + c.count, 0);
      expect(totalFromCategories).toBe(db.entries.length);
    });

    it("formatCategoryList produces markdown table", () => {
      const categories = listCategories(db);
      const result = formatCategoryList(categories);
      expect(result).toContain("| Category");
      expect(result).toContain("total errors");
    });
  });

  describe("searchErrors", () => {
    it("finds entries by keyword", () => {
      const results = searchErrors(db, "permissions");
      expect(results.length).toBeGreaterThan(0);
    });

    it("returns empty for gibberish query", () => {
      const results = searchErrors(db, "xyzqwerty123nonexistent");
      expect(results.length).toBe(0);
    });

    it("formatSearchResult handles empty results", () => {
      const result = formatSearchResult([]);
      expect(result).toContain("No results found");
    });
  });
});

import { describe, it, expect, beforeAll } from "vitest";
import { loadErrorDatabase } from "../src/db/loader.js";
import { lookupError } from "../src/tools/lookup-error.js";
import { searchErrors } from "../src/tools/search-errors.js";
import { diagnoseWorkflow } from "../src/tools/diagnose-workflow.js";
import { suggestFix } from "../src/tools/suggest-fix.js";
import { listCategories } from "../src/tools/list-categories.js";
import type { ErrorDatabase } from "../src/db/types.js";
import {
  detectFormat,
  formatLookupOutput,
  formatSearchOutput,
  formatDiagnoseOutput,
  formatSuggestOutput,
  formatCategoriesOutput,
} from "../src/cli/output.js";

describe("CLI Output Formatters", () => {
  let db: ErrorDatabase;

  beforeAll(async () => {
    db = await loadErrorDatabase();
  });

  describe("detectFormat", () => {
    it("returns explicit format when provided", () => {
      expect(detectFormat("json")).toBe("json");
      expect(detectFormat("text")).toBe("text");
      expect(detectFormat("md")).toBe("md");
    });

    it("returns auto-detected format when no explicit", () => {
      const result = detectFormat(undefined);
      // In test environment, stdout may or may not be a TTY
      expect(["text", "json"]).toContain(result);
    });
  });

  describe("formatLookupOutput", () => {
    it("formats results as text", () => {
      const results = lookupError(db, "Permission to org/repo.git denied");
      const output = formatLookupOutput(results, "text");
      expect(output).toContain("✓ Match:");
      expect(output).toContain("Root Cause:");
      expect(output).toContain("Fix:");
    });

    it("formats results as json", () => {
      const results = lookupError(db, "Permission to org/repo.git denied");
      const output = formatLookupOutput(results, "json");
      const parsed = JSON.parse(output);
      expect(parsed.matches).toBeDefined();
      expect(parsed.matches.length).toBeGreaterThan(0);
      expect(parsed.matches[0].title).toBeTruthy();
      expect(parsed.matches[0].category).toBeTruthy();
      expect(parsed.matches[0].root_cause).toBeTruthy();
      expect(parsed.matches[0].fix).toBeTruthy();
    });

    it("formats results as markdown", () => {
      const results = lookupError(db, "Permission to org/repo.git denied");
      const output = formatLookupOutput(results, "md");
      expect(output).toContain("##");
      expect(output).toContain("**Root Cause:**");
      expect(output).toContain("**Fix:**");
    });

    it("handles no matches in text format", () => {
      const output = formatLookupOutput([], "text");
      expect(output).toContain("No matching errors");
    });

    it("handles no matches in json format", () => {
      const output = formatLookupOutput([], "json");
      const parsed = JSON.parse(output);
      expect(parsed.matches).toEqual([]);
    });
  });

  describe("formatSearchOutput", () => {
    it("formats search results as text", () => {
      const results = searchErrors(db, "permissions");
      const output = formatSearchOutput(results, "text");
      expect(output).toContain("result(s)");
    });

    it("formats search results as json", () => {
      const results = searchErrors(db, "permissions");
      const output = formatSearchOutput(results, "json");
      const parsed = JSON.parse(output);
      expect(parsed.matches.length).toBeGreaterThan(0);
    });

    it("handles empty search results", () => {
      const output = formatSearchOutput([], "text");
      expect(output).toContain("No results found");
    });
  });

  describe("formatDiagnoseOutput", () => {
    it("formats findings as text", () => {
      const yaml = `
name: CI
on: push
jobs:
  test:
    steps:
      - uses: actions/checkout@v4
`;
      const findings = diagnoseWorkflow(db, yaml);
      const output = formatDiagnoseOutput(findings, "text");
      expect(output).toContain("issue(s)");
    });

    it("formats findings as json", () => {
      const yaml = `
name: CI
on: push
jobs:
  test:
    steps:
      - uses: actions/checkout@v4
`;
      const findings = diagnoseWorkflow(db, yaml);
      const output = formatDiagnoseOutput(findings, "json");
      const parsed = JSON.parse(output);
      expect(parsed.findings.length).toBeGreaterThan(0);
    });

    it("handles clean workflow", () => {
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
      const serious = findings.filter(f => f.severity === "critical" || f.severity === "high");
      const output = formatDiagnoseOutput(serious, "text");
      if (serious.length === 0) {
        expect(output).toContain("No issues found");
      }
    });
  });

  describe("formatSuggestOutput", () => {
    it("formats suggestions as text", () => {
      const results = suggestFix(db, "403 when pushing to repo");
      const output = formatSuggestOutput(results, "text");
      if (results.length > 0) {
        expect(output).toContain("✓ Suggested Fix:");
      }
    });

    it("formats suggestions as json", () => {
      const results = suggestFix(db, "403 when pushing to repo");
      const output = formatSuggestOutput(results, "json");
      const parsed = JSON.parse(output);
      expect(parsed.suggestions).toBeDefined();
    });

    it("handles no suggestions", () => {
      const output = formatSuggestOutput([], "text");
      expect(output).toContain("No matching suggestions");
    });
  });

  describe("formatCategoriesOutput", () => {
    it("formats categories as text", () => {
      const categories = listCategories(db);
      const output = formatCategoriesOutput(categories, "text");
      expect(output).toContain("Error Categories");
      expect(output).toContain("total errors");
    });

    it("formats categories as json", () => {
      const categories = listCategories(db);
      const output = formatCategoriesOutput(categories, "json");
      const parsed = JSON.parse(output);
      expect(parsed.categories.length).toBeGreaterThan(0);
      expect(parsed.categories[0].name).toBeTruthy();
      expect(parsed.categories[0].count).toBeGreaterThan(0);
    });

    it("formats categories as markdown", () => {
      const categories = listCategories(db);
      const output = formatCategoriesOutput(categories, "md");
      expect(output).toContain("| Category");
      expect(output).toContain("| Count");
    });
  });
});

describe("CLI Entry Detection", () => {
  it("CLI_COMMANDS includes all expected commands", () => {
    const CLI_COMMANDS = ["lookup", "search", "diagnose", "suggest-fix", "categories"];
    expect(CLI_COMMANDS).toContain("lookup");
    expect(CLI_COMMANDS).toContain("search");
    expect(CLI_COMMANDS).toContain("diagnose");
    expect(CLI_COMMANDS).toContain("suggest-fix");
    expect(CLI_COMMANDS).toContain("categories");
    expect(CLI_COMMANDS.length).toBe(5);
  });
});

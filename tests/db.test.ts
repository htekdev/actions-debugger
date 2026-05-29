import { describe, it, expect, beforeAll } from "vitest";
import { loadErrorDatabase } from "../src/db/loader.js";
import type { ErrorDatabase } from "../src/db/types.js";

describe("Error Database Loader", () => {
  let db: ErrorDatabase;

  beforeAll(async () => {
    db = await loadErrorDatabase();
  });

  it("loads entries from YAML files", () => {
    expect(db.entries.length).toBeGreaterThan(0);
  });

  it("builds category index", () => {
    expect(db.categories.size).toBeGreaterThan(0);
  });

  it("builds ID index", () => {
    expect(db.byId.size).toBe(db.entries.length);
  });

  it("every entry has required fields", () => {
    for (const entry of db.entries) {
      expect(entry.id).toBeTruthy();
      expect(entry.title).toBeTruthy();
      expect(entry.category).toBeTruthy();
      expect(entry.severity).toBeTruthy();
      expect(entry.root_cause).toBeTruthy();
      expect(entry.fix).toBeTruthy();
    }
  });

  it("every entry has at least one pattern", () => {
    for (const entry of db.entries) {
      expect(entry.patterns.length).toBeGreaterThan(0);
      for (const pattern of entry.patterns) {
        expect(pattern.regex).toBeTruthy();
        // Ensure regex compiles
        expect(() => new RegExp(pattern.regex, pattern.flags ?? "i")).not.toThrow();
      }
    }
  });

  it("ID format matches category-NNN", () => {
    for (const entry of db.entries) {
      expect(entry.id).toMatch(/^[a-z-]+-\d{3}$/);
    }
  });

  it("category value matches a known category", () => {
    const validCategories = [
      "yaml-syntax",
      "silent-failures",
      "runner-environment",
      "permissions-auth",
      "caching-artifacts",
      "triggers",
      "concurrency-timing",
      "known-unsolved",
    ];
    for (const entry of db.entries) {
      expect(validCategories).toContain(entry.category);
    }
  });

  it("severity value is valid", () => {
    const validSeverities = ["error", "warning", "silent-failure", "limitation"];
    for (const entry of db.entries) {
      expect(validSeverities).toContain(entry.severity);
    }
  });

  it("no duplicate IDs", () => {
    const ids = db.entries.map((e) => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});

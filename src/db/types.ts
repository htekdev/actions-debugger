/**
 * TypeScript interfaces for the GitHub Actions error database.
 */

export interface ErrorPattern {
  regex: string;
  flags?: string;
}

export interface FixCode {
  language: string;
  label: string;
  code: string;
}

export interface DocLink {
  url: string;
  label: string;
}

export interface ErrorSource {
  article: string;
  section: string;
}

export interface ErrorEntry {
  id: string;
  title: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  tags: string[];
  patterns: ErrorPattern[];
  error_messages?: string[];
  root_cause: string;
  fix: string;
  fix_code?: FixCode[];
  prevention?: string[];
  docs?: DocLink[];
  source?: ErrorSource;
}

export type ErrorCategory =
  | "yaml-syntax"
  | "silent-failures"
  | "runner-environment"
  | "permissions-auth"
  | "caching-artifacts"
  | "triggers"
  | "concurrency-timing"
  | "known-unsolved";

export type ErrorSeverity = "error" | "warning" | "silent-failure" | "limitation";

export interface ErrorDatabase {
  entries: ErrorEntry[];
  categories: Map<ErrorCategory, ErrorEntry[]>;
  byId: Map<string, ErrorEntry>;
}

export interface SearchResult {
  entry: ErrorEntry;
  score: number;
  matchType: "regex" | "exact" | "fuzzy" | "keyword";
}

export interface DiagnosticFinding {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  line?: number;
  fix: string;
  fix_code?: string;
  relatedError?: string;
}

export interface CategoryInfo {
  name: ErrorCategory;
  count: number;
  severities: Record<ErrorSeverity, number>;
}

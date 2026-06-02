/**
 * Pattern matching engine for error lookup.
 * Matches error messages against regex patterns from the error database.
 */

import type { ErrorEntry, ErrorDatabase, SearchResult } from "./types.js";

/** Maximum input length to match against (prevent ReDoS on huge logs) */
const MAX_INPUT_LENGTH = 10_000;

/**
 * Match an error message against all patterns in the database.
 * Returns results sorted by match confidence.
 */
export function lookupByPattern(
  db: ErrorDatabase,
  errorMessage: string,
  maxResults: number = 3
): SearchResult[] {
  // Truncate input for safety
  const input = errorMessage.slice(0, MAX_INPUT_LENGTH);
  const results: SearchResult[] = [];

  for (const entry of db.entries) {
    const score = matchEntry(entry, input);
    if (score > 0) {
      results.push({ entry, score, matchType: score >= 100 ? "regex" : score >= 50 ? "exact" : "fuzzy" });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, maxResults);
}

/**
 * Search the database by keyword across title, root_cause, fix, and tags.
 */
export function searchByKeyword(
  db: ErrorDatabase,
  query: string,
  options?: {
    category?: string;
    severity?: string;
    maxResults?: number;
  }
): SearchResult[] {
  const { category, severity, maxResults = 10 } = options ?? {};
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/).filter(t => t.length > 1);
  const results: SearchResult[] = [];

  for (const entry of db.entries) {
    // Apply filters
    if (category && entry.category !== category) continue;
    if (severity && entry.severity !== severity) continue;

    let score = 0;

    // Title match (highest weight)
    const titleLower = entry.title.toLowerCase();
    if (titleLower.includes(queryLower)) {
      score += 100;
    } else {
      for (const term of queryTerms) {
        if (titleLower.includes(term)) score += 30;
      }
    }

    // Tag match
    for (const tag of entry.tags ?? []) {
      const tagStr = String(tag).toLowerCase();
      if (queryTerms.includes(tagStr)) score += 25;
    }

    // Root cause match
    const rootCauseLower = entry.root_cause.toLowerCase();
    for (const term of queryTerms) {
      if (rootCauseLower.includes(term)) score += 15;
    }

    // Fix match
    const fixLower = entry.fix.toLowerCase();
    for (const term of queryTerms) {
      if (fixLower.includes(term)) score += 10;
    }

    // Error messages match
    for (const msg of entry.error_messages ?? []) {
      if (msg.toLowerCase().includes(queryLower)) {
        score += 50;
        break;
      }
    }

    if (score > 0) {
      results.push({ entry, score, matchType: "keyword" });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, maxResults);
}

/**
 * Score an entry against an error message input.
 */
function matchEntry(entry: ErrorEntry, input: string): number {
  let bestScore = 0;

  // 1. Regex pattern matching (highest confidence)
  for (const pattern of entry.patterns ?? []) {
    try {
      const flags = pattern.flags ?? "i";
      const re = new RegExp(pattern.regex, flags);
      if (re.test(input)) {
        bestScore = Math.max(bestScore, 100);
      }
    } catch {
      // Invalid regex — skip
      continue;
    }
  }

  // 2. Exact error message matching
  for (const msg of entry.error_messages ?? []) {
    if (input.includes(msg)) {
      bestScore = Math.max(bestScore, 80);
    }
    // Partial match
    const msgLower = msg.toLowerCase();
    const inputLower = input.toLowerCase();
    if (inputLower.includes(msgLower)) {
      bestScore = Math.max(bestScore, 60);
    }
  }

  // 3. Title keyword matching (lowest confidence)
  // Require words > 5 chars to avoid false positives from common short words
  // (e.g. "text", "that", "some", "runs", "jobs" appearing in unrelated inputs)
  const inputLower = input.toLowerCase();
  const titleWords = entry.title.toLowerCase().split(/\s+/);
  const matchingWords = titleWords.filter(w => w.length > 5 && inputLower.includes(w));
  if (matchingWords.length >= 2) {
    bestScore = Math.max(bestScore, 20 + matchingWords.length * 5);
  }

  return bestScore;
}

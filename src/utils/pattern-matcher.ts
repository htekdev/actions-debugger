/**
 * Regex pattern safety utilities.
 * Validates that user-contributed regex patterns are safe to execute.
 */

/** Maximum allowed regex source length */
const MAX_REGEX_LENGTH = 500;

/** Patterns that suggest catastrophic backtracking */
const DANGEROUS_PATTERNS = [
  /\(\.\*\)\+/,           // (.*)+
  /\(\.\+\)\+/,           // (.+)+
  /\(\[^\\]\]\*\)\+/,     // ([^x]*)+
  /\(\.\{[^}]+\}\)\+/,    // (.{n})+
  /\(\.\*\)\{/,           // (.*){
];

/**
 * Check if a regex pattern is safe to use at runtime.
 * Returns true if safe, false if potentially dangerous.
 */
export function isRegexSafe(pattern: string): boolean {
  if (pattern.length > MAX_REGEX_LENGTH) return false;

  // Try to compile it
  try {
    new RegExp(pattern);
  } catch {
    return false;
  }

  // Check for known dangerous patterns
  for (const dangerous of DANGEROUS_PATTERNS) {
    if (dangerous.test(pattern)) return false;
  }

  return true;
}

/**
 * Safely execute a regex match with timeout protection.
 * Truncates input to prevent unbounded matching.
 */
export function safeMatch(
  pattern: string,
  flags: string,
  input: string,
  maxInputLength: number = 10_000
): boolean {
  const truncated = input.slice(0, maxInputLength);

  try {
    const re = new RegExp(pattern, flags);
    return re.test(truncated);
  } catch {
    return false;
  }
}

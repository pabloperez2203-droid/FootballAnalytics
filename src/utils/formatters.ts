// ─── Data Formatters ──────────────────────────────────────────────────────────
// Pure functions to format values for display. No side-effects.

/**
 * Format a decimal as a percentage string.
 * @example formatPercent(0.732) → "73.2%"
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format a float to a fixed number of decimal places.
 * @example formatDecimal(2.3456, 2) → "2.35"
 */
export function formatDecimal(value: number, decimals = 2): string {
  return value.toFixed(decimals);
}

/**
 * Format a match date to locale string.
 * @example formatMatchDate('2024-10-06') → "6 Oct 2024"
 */
export function formatMatchDate(isoDate: string, locale = 'en-GB'): string {
  return new Date(isoDate).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format minutes played (e.g., 3456 → "57h 36m")
 */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/**
 * Abbreviate large numbers (e.g., 1500 → "1.5K")
 */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

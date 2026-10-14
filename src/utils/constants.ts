// ─── Global Constants ─────────────────────────────────────────────────────────
// Single source of truth for magic strings, thresholds, and palette values.

export const POSITIONS = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'CF', 'ST'] as const;

export const POSITION_LABELS: Record<string, string> = {
  GK: 'Goalkeeper',
  CB: 'Centre-Back',
  LB: 'Left-Back',
  RB: 'Right-Back',
  CDM: 'Defensive Midfielder',
  CM: 'Central Midfielder',
  CAM: 'Attacking Midfielder',
  LW: 'Left Winger',
  RW: 'Right Winger',
  CF: 'Centre-Forward',
  ST: 'Striker',
};

// ── Radar / Performance thresholds ───────────────────────────────────────────
export const RADAR_FULL_MARKS: Record<string, number> = {
  goals: 30,
  assists: 20,
  xG: 25,
  xA: 15,
  passAccuracy: 100,
  tackles: 100,
  shots: 150,
};

// ── Chart colour tokens (aligned with Tailwind palette) ───────────────────────
export const CHART_COLORS = {
  primary: '#6366f1',    // indigo-500
  secondary: '#22d3ee',  // cyan-400
  accent: '#f59e0b',     // amber-400
  danger: '#ef4444',     // red-500
  success: '#22c55e',    // green-500
  muted: '#6b7280',      // gray-500
} as const;

// ── API & pagination ──────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_RADAR_METRICS = 8;

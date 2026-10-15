export interface TeamXgData {
  rank: number;
  team: string;
  matches_played: number;
  goals_for: number;
  xg_for: number;
  np_xg_for: number;
  goals_against: number;
  xg_against: number;
  ppda_avg: number;
  deep_completions: number;
  expected_points: number;
  pts?: number;
  diff_pts_xpts?: number;
  diff_goals_xg: number;
  diff_goals_xg_against: number;
  xg_per_match: number;
  goals_per_match: number;
  source?: string;
  fetched_at?: string;
  season?: string;
  is_simulated?: boolean;
}

export interface TeamJusticeStats extends TeamXgData {
  realPts: number;
  diffPts: number; // realPts - expected_points
  realRank: number;
  xptsRank: number;
  status: 'over' | 'balanced' | 'under';
  statusLabel: string;
}

export interface PercentileMetric {
  key: string;
  label: string;
  shortLabel: string;
  higherIsBetter: boolean;
  unit: string;
  description: string;
}

export interface RawPlayerData {
  league?: string;
  season?: string;
  team_name: string;
  player_name: string;
  league_id?: string | number;
  season_id?: number;
  team_id?: number;
  player_id: number | string;
  position: string;
  matches: number;
  minutes: number;
  goals: number;
  xg: number;
  np_goals: number;
  np_xg: number;
  assists: number;
  xa: number;
  shots: number;
  key_passes: number;
  yellow_cards: number;
  red_cards: number;
  xg_chain: number;
  xg_buildup: number;
  diff_goals_xg: number;
  // Métricas analíticas avanzadas 2026
  npxg_per_90?: number;
  xa_per_90?: number;
  npxg_xa_per_90?: number;
  progressive_passes?: number;
  progressive_passes_per_90?: number;
  progressive_carries?: number;
  progressive_carries_per_90?: number;
  sca?: number;
  sca_per_90?: number;
  gca?: number;
  gca_per_90?: number;
  successful_pressures?: number;
  successful_pressures_per_90?: number;
  final_third_recoveries?: number;
  final_third_recoveries_per_90?: number;
  photo?: string;
  source?: string;
  fetched_at?: string;
  is_simulated?: boolean;
}

export interface PlayerComputedMetrics extends RawPlayerData {
  p90: {
    npxg: number;
    xa: number;
    threat: number; // npxg + xa
    xgChain: number;
    xgBuildup: number;
    shots: number;
    keyPasses: number;
    goals: number;
    progressivePasses?: number;
    progressiveCarries?: number;
    sca?: number;
    gca?: number;
    pressures?: number;
    finalThirdRecoveries?: number;
  };
  npxgPerShot: number;
  finishingDelta: number; // goals - xg
}

export interface CloneMatch {
  player: PlayerComputedMetrics;
  similarityPct: number;
  distance: number;
  keyStrengths: string[];
}

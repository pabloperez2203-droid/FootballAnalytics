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

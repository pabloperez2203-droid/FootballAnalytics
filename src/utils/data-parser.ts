// ─── Data Parser ──────────────────────────────────────────────────────────────
// Transforms raw API/DB responses into the internal domain model.
// Never expose raw DB rows beyond this module — always parse first.

import type { Player, Match, PlayerStats } from '@/types/football';

// ── Players ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parsePlayer(raw: any): Player {
  return {
    id: raw.id,
    name: raw.name,
    position: raw.position,
    preferredFoot: raw.preferred_foot ?? 'right',
    age: raw.age,
    nationality: raw.nationality ?? 'Unknown',
    teamId: raw.team_id,
    jerseyNumber: raw.jersey_number ?? 0,
    imageUrl: raw.image_url ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parsePlayers(rawList: any[]): Player[] {
  return rawList.map(parsePlayer);
}

// ── Matches ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseMatch(raw: any): Match {
  return {
    id: raw.id,
    homeTeamId: raw.home_team_id,
    awayTeamId: raw.away_team_id,
    homeScore: raw.home_score ?? 0,
    awayScore: raw.away_score ?? 0,
    date: raw.date,
    leagueId: raw.league_id,
    season: raw.season,
    venue: raw.venue ?? 'Unknown',
    status: raw.status ?? 'finished',
  };
}

// ── Player Stats ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parsePlayerStats(raw: any): PlayerStats {
  return {
    playerId: raw.player_id,
    season: raw.season,
    matchesPlayed: raw.matches_played ?? 0,
    minutesPlayed: raw.minutes_played ?? 0,
    goals: raw.goals ?? 0,
    assists: raw.assists ?? 0,
    shots: raw.shots ?? 0,
    shotsOnTarget: raw.shots_on_target ?? 0,
    xG: raw.xg ?? 0,
    xA: raw.xa ?? 0,
    passAccuracy: raw.pass_accuracy ?? 0,
    tackles: raw.tackles ?? 0,
    interceptions: raw.interceptions ?? 0,
    yellowCards: raw.yellow_cards ?? 0,
    redCards: raw.red_cards ?? 0,
  };
}

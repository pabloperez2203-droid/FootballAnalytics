// ─── Core Football Domain Types ───────────────────────────────────────────────
// This file is the single source of truth for all football entities.
// Never use `any` — extend these types as the data model evolves.

export type Position = 'GK' | 'CB' | 'LB' | 'RB' | 'CDM' | 'CM' | 'CAM' | 'LW' | 'RW' | 'CF' | 'ST';

export type Foot = 'left' | 'right' | 'both';

export interface Player {
  id: string;
  name: string;
  position: Position;
  preferredFoot: Foot;
  age: number;
  nationality: string;
  teamId: string;
  jerseyNumber: number;
  imageUrl?: string;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
  leagueId: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  date: string; // ISO 8601
  leagueId: string;
  season: string;
  venue: string;
  status: 'scheduled' | 'live' | 'finished' | 'postponed';
}

export interface MatchEvent {
  id: string;
  matchId: string;
  type: 'goal' | 'assist' | 'yellow_card' | 'red_card' | 'substitution' | 'shot' | 'foul';
  minute: number;
  playerId: string;
  teamId: string;
  metadata?: Record<string, unknown>;
}

export interface PlayerStats {
  playerId: string;
  season: string;
  matchesPlayed: number;
  minutesPlayed: number;
  goals: number;
  assists: number;
  shots: number;
  shotsOnTarget: number;
  xG: number;          // Expected Goals
  xA: number;          // Expected Assists
  passAccuracy: number; // Percentage 0–100
  tackles: number;
  interceptions: number;
  yellowCards: number;
  redCards: number;
}

export interface League {
  id: string;
  name: string;
  country: string;
  logoUrl?: string;
  season: string;
}

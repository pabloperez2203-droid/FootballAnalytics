// ─── Centralized Supabase Queries ─────────────────────────────────────────────
// All database reads and writes go here. Never query Supabase directly from
// components or pages — import from this module instead.
// This enforces a single place to manage caching, error handling, and RLS.

import { createClient } from './server';

// ── Players ──────────────────────────────────────────────────────────────────

export async function getAllPlayers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw new Error(`getAllPlayers: ${error.message}`);
  return data;
}

export async function getPlayerById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(`getPlayerById: ${error.message}`);
  return data;
}

// ── Matches ───────────────────────────────────────────────────────────────────

export async function getRecentMatches(limit = 10) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .order('date', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`getRecentMatches: ${error.message}`);
  return data;
}

export async function getMatchById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw new Error(`getMatchById: ${error.message}`);
  return data;
}

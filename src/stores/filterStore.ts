import { useSyncExternalStore, useEffect } from 'react';

export type CompetitionType = 'laliga' | 'ucl';

export interface CompetitionMeta {
  id: CompetitionType;
  name: string;
  shortName: string;
  season: string;
  teamCount: number;
  primaryColor: string;
  accentColor: string;
  glowColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  dotColor: string;
}

export const COMPETITIONS: Record<CompetitionType, CompetitionMeta> = {
  laliga: {
    id: 'laliga',
    name: 'LaLiga EA Sports',
    shortName: 'LaLiga',
    season: '2026-27',
    teamCount: 20,
    primaryColor: '#10b981', // emerald-500
    accentColor: '#3b82f6', // blue
    glowColor: 'rgba(16, 185, 129, 0.25)',
    badgeBg: 'bg-emerald-500/10',
    badgeBorder: 'border-emerald-500/25',
    badgeText: 'text-emerald-400',
    dotColor: '#10b981',
  },
  ucl: {
    id: 'ucl',
    name: 'UEFA Champions League',
    shortName: 'Champions League',
    season: '2026-27',
    teamCount: 36,
    primaryColor: '#38bdf8', // sky/cyan Champions
    accentColor: '#6366f1', // indigo
    glowColor: 'rgba(56, 189, 248, 0.3)',
    badgeBg: 'bg-sky-500/10',
    badgeBorder: 'border-sky-500/30',
    badgeText: 'text-sky-400',
    dotColor: '#38bdf8',
  },
};

let currentCompetition: CompetitionType = 'laliga';
const listeners = new Set<() => void>();

function getSnapshot(): CompetitionType {
  return currentCompetition;
}

function getServerSnapshot(): CompetitionType {
  return 'laliga';
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

let hasHydrated = false;

export function setCompetition(comp: CompetitionType) {
  const validComp = comp === 'ucl' ? 'ucl' : 'laliga';
  if (validComp !== currentCompetition) {
    currentCompetition = validComp;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('xg_competition', validComp);
      } catch {}
    }
    listeners.forEach(cb => cb());
  }
}

export function getCompetition(): CompetitionType {
  return currentCompetition;
}

export function useCompetition() {
  const rawComp = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const competition = rawComp === 'ucl' ? 'ucl' : 'laliga';
  const meta = COMPETITIONS[competition] || COMPETITIONS.laliga;

  useEffect(() => {
    if (!hasHydrated && typeof window !== 'undefined') {
      hasHydrated = true;
      try {
        const saved = localStorage.getItem('xg_competition') as CompetitionType;
        if ((saved === 'ucl' || saved === 'laliga') && saved !== currentCompetition) {
          currentCompetition = saved;
          listeners.forEach(cb => cb());
        }
      } catch {}
    }
  }, []);

  return {
    competition,
    setCompetition,
    meta,
    isUcl: competition === 'ucl',
    isLaLiga: competition === 'laliga',
  };
}

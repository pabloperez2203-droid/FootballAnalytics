"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getTeamCrest } from '@/utils/crests';
import { useCompetition } from '@/stores/filterStore';

interface MatchItem {
  id: string;
  matchday: number;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  home_xg: number;
  away_xg: number;
}

export default function MatchTicker() {
  const { competition, meta } = useCompetition();
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [matchday, setMatchday] = useState<number>(8);

  useEffect(() => {
    const dataUrl = competition === 'ucl' ? '/data/matches/ucl_index.json' : '/data/matches/index.json';
    fetch(dataUrl)
      .then(res => res.json())
      .then((data: MatchItem[]) => {
        if (data && data.length > 0) {
          const maxMd = Math.max(...data.map(m => Number(m.matchday) || 1));
          setMatchday(maxMd);
          const latest = data.filter(m => Number(m.matchday) === maxMd);
          setMatches(latest.length > 0 ? latest : data.slice(-10));
        }
      })
      .catch(err => console.error("Error loading matches for ticker", err));
  }, [competition]);

  if (matches.length === 0) return null;

  // Duplicamos la lista para crear un bucle continuo infinito y fluido (-50%)
  const tickerItems = [...matches, ...matches];

  return (
    <div className="w-full bg-[#090c10]/95 border-b border-white/10 backdrop-blur-md overflow-hidden select-none relative z-30">
      <div className="flex items-center">
        {/* Etiqueta fija izquierda tipo transmisión deportiva */}
        <div
          className={`shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2 border-r font-mono text-[11px] font-bold tracking-wider uppercase z-10 shadow-sm ${
            competition === 'ucl'
              ? 'bg-sky-950/60 border-sky-500/20 text-sky-400'
              : 'bg-emerald-950/60 border-emerald-500/20 text-emerald-400'
          }`}
        >
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{
              backgroundColor: meta.dotColor,
              boxShadow: `0 0 8px ${meta.dotColor}`,
            }}
          />
          <span>{competition === 'ucl' ? 'UCL' : 'LaLiga'} J{matchday}</span>
        </div>

        {/* Carrusel en bucle continuo */}
        <div className="flex-1 overflow-hidden py-1.5 relative">
          <div className="animate-marquee items-center gap-4 sm:gap-6">
            {tickerItems.map((m, idx) => {
              const homeCrest = getTeamCrest(m.home_team);
              const awayCrest = getTeamCrest(m.away_team);

              return (
                <Link
                  key={`${m.id}-${idx}`}
                  href={`/matches?id=${m.id}`}
                  className="flex items-center gap-2.5 px-3 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-emerald-500/40 transition-all duration-200 group whitespace-nowrap cursor-pointer shadow-sm shrink-0"
                >
                  {/* Local */}
                  <div className="flex items-center gap-1.5">
                    {homeCrest ? (
                      <img src={homeCrest} alt={m.home_team} className="w-4 h-4 object-contain drop-shadow" />
                    ) : null}
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">
                      {m.home_team}
                    </span>
                  </div>

                  {/* Marcador */}
                  <div className="px-1.5 py-0.5 rounded bg-black/40 border border-white/10 font-mono font-bold text-xs text-emerald-400 group-hover:border-emerald-500/40 tabular-nums">
                    {m.home_score} - {m.away_score}
                  </div>

                  {/* Visitante */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-white transition-colors">
                      {m.away_team}
                    </span>
                    {awayCrest ? (
                      <img src={awayCrest} alt={m.away_team} className="w-4 h-4 object-contain drop-shadow" />
                    ) : null}
                  </div>

                  {/* Separador y xG */}
                  <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 border-l border-white/10 pl-2">
                    <span className="text-slate-500">xG:</span>
                    <span className="text-slate-300 font-semibold">{Number(m.home_xg).toFixed(2)}</span>
                    <span className="text-slate-500">-</span>
                    <span className="text-slate-300 font-semibold">{Number(m.away_xg).toFixed(2)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

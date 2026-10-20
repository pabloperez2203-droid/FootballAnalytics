"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { getTeamCrest, getMatchTeamColors } from '@/utils/crests';

interface ShotTimelineTableProps {
  shots: any[];
  homeTeam?: string;
  awayTeam?: string;
  hoveredShotId?: string | number | null;
  onHoverShot?: (id: string | number | null) => void;
  homeColor?: string;
  awayColor?: string;
}

type FilterType = 'all' | 'goals' | 'big_chances' | 'home' | 'away';

export default function ShotTimelineTable({
  shots,
  homeTeam = 'Local',
  awayTeam = 'Visitante',
  hoveredShotId,
  onHoverShot,
  homeColor,
  awayColor
}: ShotTimelineTableProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [photos, setPhotos] = useState<Record<string, any>>({});

  const colors = (homeColor && awayColor)
    ? { homeColor, awayColor }
    : getMatchTeamColors(homeTeam, awayTeam);
  const resolvedHomeColor = colors.homeColor;
  const resolvedAwayColor = colors.awayColor;

  useEffect(() => {
    fetch('/data/player_photos.json')
      .then(res => res.json())
      .then(data => setPhotos(data))
      .catch(() => {
        fetch('/data/players_photos.json')
          .then(res => res.json())
          .then(data => setPhotos(data))
          .catch(() => {});
      });
  }, []);

  const getPlayerPhoto = (shot: any) => {
    const teamName = shot.team === 'home' ? homeTeam : awayTeam;
    return (
      photos[`${teamName}|${shot.player}`] ||
      photos[shot.player] ||
      shot.photo ||
      (photos._by_id && shot.player_id && photos._by_id[shot.player_id]?.url)
    );
  };

  const isGoal = (s: any) => {
    const res = String(s.result || '').toLowerCase();
    return res === 'gol' || res === 'goal';
  };

  // Filtered & sorted shots
  const sortedShots = useMemo(() => {
    const copy = [...shots].sort((a, b) => (Number(a.min ?? a.minute) || 0) - (Number(b.min ?? b.minute) || 0));

    if (filter === 'goals') {
      return copy.filter(isGoal);
    }
    if (filter === 'big_chances') {
      return copy.filter(s => (Number(s.xg) || 0) >= 0.20);
    }
    if (filter === 'home') {
      return copy.filter(s => s.team === 'home');
    }
    if (filter === 'away') {
      return copy.filter(s => s.team === 'away');
    }
    return copy;
  }, [shots, filter]);

  // Counts for pills
  const totalCount = shots.length;
  const goalsCount = shots.filter(isGoal).length;
  const bigChancesCount = shots.filter(s => (Number(s.xg) || 0) >= 0.20).length;
  const homeCount = shots.filter(s => s.team === 'home').length;
  const awayCount = shots.filter(s => s.team === 'away').length;

  // Format Result Badge
  const renderResultBadge = (resultStr: string) => {
    const r = String(resultStr || '').toLowerCase();
    if (r === 'gol' || r === 'goal') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)] animate-pulse">
          <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M12 2a10 10 0 0 1 10 10l-4.5-1.5L14 6l-2-4z" />
          </svg>
          GOL
        </span>
      );
    }
    if (r === 'parada' || r === 'savedshot') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30">
          Parada
        </span>
      );
    }
    if (r.includes('block') || r === 'bloqueado') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
          Bloqueado
        </span>
      );
    }
    if (r.includes('post') || r === 'al palo') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
          Al Palo
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-800 text-slate-400 border border-white/5">
        Fuera
      </span>
    );
  };

  // Find index of first second-half shot for divider
  let firstSecondHalfIndex = -1;
  if (filter === 'all') {
    firstSecondHalfIndex = sortedShots.findIndex(s => (Number(s.min ?? s.minute) || 0) > 45);
  }

  return (
    <div className="glass-card rounded-2xl p-6 h-full flex flex-col transition-all duration-300 hover:-translate-y-0.5">
      {/* Header con título a la izquierda y filtros a la derecha perfectamente alineados */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="lbl font-semibold text-white">Feed de Ocasiones</div>
          <span className="h-6 px-2 flex items-center justify-center text-[11px] font-mono text-slate-400 bg-white/5 rounded-md border border-white/10 leading-none">
            {sortedShots.length} {sortedShots.length === 1 ? 'tiro' : 'tiros'}
          </span>
        </div>

        {/* Filter Pills con altura y alineación homogénea táctil */}
        <div className="w-full sm:w-auto overflow-x-auto no-scrollbar flex items-center gap-1.5 bg-white/[0.03] p-1.5 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`min-h-[36px] sm:min-h-[28px] px-3 inline-flex items-center justify-center text-xs whitespace-nowrap rounded-lg transition-all cursor-pointer touch-manipulation active:scale-95 shrink-0 ${
              filter === 'all'
                ? 'bg-slate-700 text-white font-bold shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Todos ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('goals')}
            className={`min-h-[36px] sm:min-h-[28px] px-3 inline-flex items-center justify-center text-xs whitespace-nowrap rounded-lg transition-all cursor-pointer touch-manipulation active:scale-95 shrink-0 ${
              filter === 'goals'
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-bold'
                : 'text-slate-400 hover:text-emerald-300 hover:bg-white/[0.04]'
            }`}
          >
            Goles ({goalsCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('big_chances')}
            className={`min-h-[36px] sm:min-h-[28px] px-3 inline-flex items-center justify-center text-xs whitespace-nowrap rounded-lg transition-all cursor-pointer touch-manipulation active:scale-95 shrink-0 ${
              filter === 'big_chances'
                ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-slate-400 hover:text-amber-300 hover:bg-white/[0.04]'
            }`}
          >
            Grandes Ocasiones ({bigChancesCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('home')}
            style={filter === 'home' ? { backgroundColor: `${resolvedHomeColor}33`, color: resolvedHomeColor, borderColor: `${resolvedHomeColor}66` } : undefined}
            className={`min-h-[36px] sm:min-h-[28px] px-3 inline-flex items-center justify-center text-xs whitespace-nowrap rounded-lg border border-transparent transition-all cursor-pointer touch-manipulation active:scale-95 shrink-0 ${
              filter === 'home'
                ? 'font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            {homeTeam.substring(0, 3).toUpperCase()} ({homeCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter('away')}
            style={filter === 'away' ? { backgroundColor: `${resolvedAwayColor}33`, color: resolvedAwayColor, borderColor: `${resolvedAwayColor}66` } : undefined}
            className={`min-h-[36px] sm:min-h-[28px] px-3 inline-flex items-center justify-center text-xs whitespace-nowrap rounded-lg border border-transparent transition-all cursor-pointer touch-manipulation active:scale-95 shrink-0 ${
              filter === 'away'
                ? 'font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            {awayTeam.substring(0, 3).toUpperCase()} ({awayCount})
          </button>
        </div>
      </div>

      {/* Visual Occasions Feed with internal scroll */}
      <div className="flex-1 max-h-[520px] overflow-y-auto custom-scrollbar pr-1.5 space-y-2">
        {sortedShots.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No hay tiros que coincidan con el filtro seleccionado.
          </div>
        ) : (
          sortedShots.map((shot, idx) => {
            const min = Number(shot.min ?? shot.minute) || 0;
            const xg = Number(shot.xg) || 0;
            const teamName = shot.team === 'home' ? homeTeam : awayTeam;
            const crest = getTeamCrest(teamName);
            const teamColor = shot.team === 'home' ? resolvedHomeColor : resolvedAwayColor;
            const photo = getPlayerPhoto(shot);
            const isActive = hoveredShotId != null && String(hoveredShotId) === String(shot.id);
            const shotIsGoal = isGoal(shot);

            // Probability mini bar fill (0 to 100%)
            const barWidth = Math.min(100, Math.max(8, (xg / 0.6) * 100));
            const barColor =
              xg >= 0.35
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : xg >= 0.15
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                : 'bg-gradient-to-r from-sky-500 to-blue-400';

            // Show halftime divider
            const showHalftime = filter === 'all' && idx === firstSecondHalfIndex && firstSecondHalfIndex > 0;

            return (
              <React.Fragment key={shot.id || idx}>
                {showHalftime && (
                  <div className="flex items-center gap-3 my-3 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-white/10 text-slate-400">
                    <div className="h-px flex-1 bg-white/10" />
                    <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-slate-400">
                      Descanso · 45'
                    </span>
                    <div className="h-px flex-1 bg-white/10" />
                  </div>
                )}

                {/* Timeline Card */}
                <div
                  onMouseEnter={() => onHoverShot?.(shot.id)}
                  onMouseLeave={() => onHoverShot?.(null)}
                  style={isActive ? { borderColor: `${teamColor}99`, boxShadow: `0 4px 20px -2px ${teamColor}33` } : undefined}
                  className={`group relative rounded-xl p-3 transition-all duration-200 cursor-pointer border ${
                    isActive
                      ? 'bg-white/[0.08] translate-x-1'
                      : shotIsGoal
                      ? 'bg-emerald-950/20 border-emerald-500/30 hover:bg-emerald-950/30 hover:border-emerald-500/50'
                      : 'bg-slate-900/40 border-white/5 hover:bg-white/[0.04] hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Minute on left in font-mono */}
                    <div className="w-10 text-center shrink-0">
                      <span className="font-mono text-xs font-bold text-slate-300 bg-white/5 px-2 py-1 rounded-md border border-white/5 group-hover:border-white/20 transition-colors">
                        {min}'
                      </span>
                    </div>

                    {/* Team Crest & Player Avatar */}
                    <div className="relative shrink-0 flex items-center">
                      <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                        {photo ? (
                          <img
                            src={photo}
                            alt={shot.player}
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <span className="text-[11px] font-bold text-white font-mono">
                            {shot.player
                              ? shot.player.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                              : '??'}
                          </span>
                        )}
                      </div>
                      {crest && (
                        <img
                          src={crest}
                          alt={teamName}
                          className="w-4 h-4 object-contain absolute -bottom-1 -right-1 drop-shadow"
                        />
                      )}
                    </div>

                    {/* Player Info & Shot detail */}
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: teamColor }}
                        />
                        <h4 className="font-semibold text-xs sm:text-sm text-white truncate">
                          {shot.player}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 truncate">
                        <span>{teamName}</span>
                        {shot.situation && (
                          <>
                            <span>•</span>
                            <span className="capitalize">{shot.situation}</span>
                          </>
                        )}
                        {shot.player_assisted && (
                          <>
                            <span>•</span>
                            <span className="text-slate-500">Asist: {shot.player_assisted}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* xG mini visual probability bar + number */}
                    <div className="w-24 sm:w-28 shrink-0 flex flex-col items-end gap-1">
                      <div className="flex items-baseline gap-1 font-mono">
                        <span className="text-[9px] text-slate-500 font-semibold uppercase">xG</span>
                        <span className="text-xs font-bold text-white tabular-nums">
                          {xg.toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden p-0.2">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>

                    {/* Result Badge */}
                    <div className="shrink-0 pl-1">
                      {renderResultBadge(shot.result)}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
      </div>
    </div>
  );
}

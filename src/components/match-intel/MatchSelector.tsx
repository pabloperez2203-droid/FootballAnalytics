import React from 'react';
import { getTeamCrest } from '@/utils/crests';
import { useCompetition } from '@/stores/filterStore';

export default function MatchSelector({ 
  matchData, 
  onSelectMatch, 
  onSelectMatchday 
}: { 
  matchData: any, 
  onSelectMatch?: (id: string) => void,
  onSelectMatchday?: (dir: 'prev' | 'next') => void
}) {
  const { competition } = useCompetition();
  const isUcl = competition === 'ucl';
  const { matchday, matches_in_matchday = [], id } = matchData;

  // In Champions League there are 18 matches per matchday, in LaLiga 10
  const maxSlots = isUcl ? 18 : 10;
  const matchesToRender = [...matches_in_matchday.slice(0, maxSlots)];
  while (matchesToRender.length < maxSlots) {
    matchesToRender.push(null);
  }

  const matchdayLabel = isUcl ? `Fase de Liga · Jornada ${matchday}` : `Jornada ${matchday}`;

  return (
    <div className="card glow mb-4 flex flex-col xl:flex-row items-center justify-between px-3 sm:px-[22px] py-3.5 sm:py-3 gap-3 sm:gap-4">
      {/* Selector de Jornada */}
      <div className="flex items-center justify-between sm:justify-center gap-3 w-full xl:w-auto shrink-0 bg-white/[0.03] xl:bg-transparent p-2 sm:p-0 rounded-2xl border border-white/10 xl:border-none">
        <button 
          type="button"
          onClick={() => onSelectMatchday && onSelectMatchday('prev')}
          className="w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-white/[0.06] hover:bg-white/15 active:bg-white/25 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer touch-manipulation active:scale-95 text-sm"
          aria-label="Jornada anterior"
        >
          ◀
        </button>
        <span className={`font-semibold text-xs sm:text-sm whitespace-nowrap text-center ${
          isUcl ? 'min-w-[170px] text-cyan-400' : 'min-w-[100px] text-slate-200'
        }`}>
          {matchdayLabel}
        </span>
        <button 
          type="button"
          onClick={() => onSelectMatchday && onSelectMatchday('next')}
          className="w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl bg-white/[0.06] hover:bg-white/15 active:bg-white/25 text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer touch-manipulation active:scale-95 text-sm"
          aria-label="Jornada siguiente"
        >
          ▶
        </button>
      </div>

      {/* Grid / Carrusel Táctil de Partidos */}
      <div className={`w-full flex-1 overflow-x-auto no-scrollbar py-0.5 flex sm:grid gap-1.5 sm:gap-1.5 ${
        isUcl
          ? 'sm:grid-cols-6 lg:grid-cols-9'
          : 'sm:grid-cols-5 lg:grid-cols-10'
      }`}>
        {matchesToRender.map((m: any, idx: number) => {
          if (!m) {
            return (
              <div key={`empty-${idx}`} className="hidden sm:flex h-full min-h-[44px] rounded-xl border border-dashed border-slate-700/50 bg-slate-800/10 items-center justify-center opacity-50">
                <span className="text-[10px] text-slate-600 font-medium">--</span>
              </div>
            );
          }

          const homeCrest = getTeamCrest(m.home_team);
          const awayCrest = getTeamCrest(m.away_team);
          const isSelected = m.id === id;

          return (
            <button 
              type="button"
              key={m.id} 
              onClick={() => onSelectMatch && onSelectMatch(m.id)}
              className={`min-w-[85px] sm:min-w-0 min-h-[44px] px-2 py-1.5 rounded-xl border transition-all whitespace-nowrap relative flex items-center justify-center gap-1 sm:gap-1.5 shrink-0 sm:shrink cursor-pointer touch-manipulation active:scale-95 ${
                isSelected 
                  ? 'bg-slate-700 text-white border-slate-400 shadow-md ring-1 ring-white/20' 
                  : 'bg-[#1a2024]/90 text-slate-400 border-white/10 hover:text-slate-200 hover:bg-white/[0.08]'
              }`}
            >
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 w-full pointer-events-none">
                {homeCrest ? (
                  <img src={homeCrest} alt={m.home_team} className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
                ) : (
                  <span className="text-[10px] font-bold">{m.home_team.substring(0,3).toUpperCase()}</span>
                )}
                <span className="text-[9px] text-slate-500 font-medium">vs</span>
                {awayCrest ? (
                  <img src={awayCrest} alt={m.away_team} className="w-5 h-5 sm:w-6 sm:h-6 object-contain" />
                ) : (
                  <span className="text-[10px] font-bold">{m.away_team.substring(0,3).toUpperCase()}</span>
                )}
              </div>
              
              {m.needs_review && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" title="Requiere revisión de datos" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

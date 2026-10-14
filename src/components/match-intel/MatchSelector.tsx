import React from 'react';
import { getTeamCrest } from '@/utils/crests';

export default function MatchSelector({ 
  matchData, 
  onSelectMatch, 
  onSelectMatchday 
}: { 
  matchData: any, 
  onSelectMatch?: (id: string) => void,
  onSelectMatchday?: (dir: 'prev' | 'next') => void
}) {
  const { matchday, matches_in_matchday, id } = matchData;

  // Pad matches to always have 10 slots
  const matchesToRender = [...matches_in_matchday.slice(0, 10)];
  while (matchesToRender.length < 10) {
    matchesToRender.push(null);
  }

  return (
    <div className="card glow mb-4 flex flex-col xl:flex-row items-center justify-between px-[22px] py-3 gap-4">
      <div className="flex items-center gap-4 shrink-0">
        <button 
          onClick={() => onSelectMatchday && onSelectMatchday('prev')}
          className="text-slate-400 hover:text-white transition-colors"
        >
          ◀
        </button>
        <span className="font-semibold text-sm whitespace-nowrap w-[75px] text-center">Jornada {matchday}</span>
        <button 
          onClick={() => onSelectMatchday && onSelectMatchday('next')}
          className="text-slate-400 hover:text-white transition-colors"
        >
          ▶
        </button>
      </div>
      <div className="grid grid-cols-5 lg:grid-cols-10 gap-1.5 w-full flex-1">
        {matchesToRender.map((m: any, idx: number) => {
          if (!m) {
            return (
              <div key={`empty-${idx}`} className="h-full min-h-[36px] rounded border border-dashed border-slate-700/50 bg-slate-800/10 flex items-center justify-center opacity-50">
                <span className="text-[10px] text-slate-600 font-medium">--</span>
              </div>
            );
          }

          const homeCrest = getTeamCrest(m.home_team);
          const awayCrest = getTeamCrest(m.away_team);
          return (
            <button 
              key={m.id} 
              onClick={() => onSelectMatch && onSelectMatch(m.id)}
              className={`px-1 py-1.5 rounded border transition-colors whitespace-nowrap relative flex items-center justify-center gap-1 sm:gap-1.5 w-full ${m.id === id ? 'bg-slate-700 text-white border-slate-500' : 'bg-[#1a2024] text-slate-400 border-[var(--line)] hover:text-slate-200'}`}
            >
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 w-full">
                {homeCrest ? <img src={homeCrest} alt={m.home_team} className="w-5 h-5 sm:w-6 sm:h-6 object-contain" /> : <span className="text-[10px] font-bold">{m.home_team.substring(0,3).toUpperCase()}</span>}
                <span className="text-[9px] text-slate-500 font-medium">vs</span>
                {awayCrest ? <img src={awayCrest} alt={m.away_team} className="w-5 h-5 sm:w-6 sm:h-6 object-contain" /> : <span className="text-[10px] font-bold">{m.away_team.substring(0,3).toUpperCase()}</span>}
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

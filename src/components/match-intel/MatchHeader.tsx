import React from 'react';
import { getTeamCrest } from '@/utils/crests';

export default function MatchHeader({ matchData }: { matchData: any }) {
  const { home_team, home_short, away_team, away_short, home_score, away_score, home_xg, away_xg, date, stadium } = matchData;
  const homeCrest = getTeamCrest(home_team);
  const awayCrest = getTeamCrest(away_team);

  return (
    <div className="card glow mb-4 px-[22px] py-6 flex flex-col items-center justify-center relative min-h-[140px]">
      <div className="absolute top-4 right-4 flex items-center gap-3">
         <span className="text-xs text-slate-400">{date} · {stadium}</span>
      </div>

      <div className="flex items-center justify-center gap-8 w-full max-w-2xl mt-4">
        <div className="flex flex-col items-center gap-3 flex-1">
          <div className="w-20 h-20 rounded-full flex items-center justify-center border border-slate-700/50 shadow-lg text-xl font-bold bg-white/5 p-2">
            {homeCrest ? <img src={homeCrest} alt={home_team} className="w-full h-full object-contain drop-shadow-md" /> : home_short}
          </div>
          <span className="font-semibold text-lg text-center">{home_team}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className="text-5xl font-black tabular-nums tracking-tighter">
             {home_score} - {away_score}
          </div>
          <div className="text-sm text-slate-400 font-mono mt-1">
             xG <span className="font-semibold">{home_xg.toFixed(2)}</span> – <span className="font-semibold">{away_xg.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 flex-1">
          <div className="w-20 h-20 rounded-full flex items-center justify-center border border-slate-700/50 shadow-lg text-xl font-bold bg-white/5 p-2">
            {awayCrest ? <img src={awayCrest} alt={away_team} className="w-full h-full object-contain drop-shadow-md" /> : away_short}
          </div>
          <span className="font-semibold text-lg text-center">{away_team}</span>
        </div>
      </div>
    </div>
  );
}

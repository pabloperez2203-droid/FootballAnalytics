import React from 'react';
import { getTeamCrest, getTeamColor } from '@/utils/crests';

export default function MatchHeader({ matchData }: { matchData: any }) {
  const { home_team, home_short, away_team, away_short, home_score, away_score, home_xg, away_xg, date, stadium } = matchData;
  const homeCrest = getTeamCrest(home_team);
  const awayCrest = getTeamCrest(away_team);
  const homeColor = getTeamColor(home_team);
  const awayColor = getTeamColor(away_team);

  const totalXg = (home_xg || 0) + (away_xg || 0);
  const homeXgPercent = totalXg > 0 ? (home_xg / totalXg) * 100 : 50;
  const awayXgPercent = 100 - homeXgPercent;

  return (
    <div className="glass-card mb-4 px-6 py-6 flex flex-col items-center justify-center relative min-h-[160px] overflow-hidden rounded-2xl">
      {/* Luces ambientales en los extremos de la tarjeta */}
      <div
        className="absolute -left-12 -top-12 w-48 h-48 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ backgroundColor: homeColor }}
      />
      <div
        className="absolute -right-12 -top-12 w-48 h-48 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ backgroundColor: awayColor }}
      />

      <div className="absolute top-4 right-4 flex items-center gap-3">
         <span className="text-xs text-slate-400 font-medium">{date} {stadium ? `· ${stadium}` : ''}</span>
      </div>

      <div className="flex items-center justify-center gap-6 sm:gap-10 w-full max-w-2xl mt-4">
        {/* Local */}
        <div className="flex flex-col items-center gap-3 flex-1">
          <div className="relative group">
            <div
              className="absolute -inset-3 rounded-full blur-3xl opacity-20 pointer-events-none transition-opacity duration-300 group-hover:opacity-35"
              style={{ backgroundColor: homeColor }}
            />
            <div
              className="relative w-20 h-20 rounded-full flex items-center justify-center border border-white/10 shadow-lg text-xl font-bold bg-white/5 p-2 backdrop-blur-sm transition-transform duration-300 group-hover:scale-105"
              style={{ boxShadow: `0 0 24px -6px ${homeColor}40` }}
            >
              {homeCrest ? <img src={homeCrest} alt={home_team} className="w-full h-full object-contain drop-shadow-md" /> : home_short}
            </div>
          </div>
          <span className="font-semibold text-lg text-center tracking-tight">{home_team}</span>
        </div>

        {/* Marcador y analítica xG */}
        <div className="flex flex-col items-center gap-1.5 px-2">
          <div className="text-5xl md:text-6xl font-black font-mono tabular-nums tracking-tighter">
             {home_score} - {away_score}
          </div>
          
          <div className="text-xs sm:text-sm text-slate-400 font-mono mt-1 flex items-center gap-2">
             <span>xG</span>
             <span className="font-semibold text-slate-200" style={{ color: home_xg > away_xg ? homeColor : undefined }}>
               {Number(home_xg).toFixed(2)}
             </span>
             <span className="text-slate-500">–</span>
             <span className="font-semibold text-slate-200" style={{ color: away_xg > home_xg ? awayColor : undefined }}>
               {Number(away_xg).toFixed(2)}
             </span>
          </div>

          {/* Barra de acento / comparación xG con colores dinámicos */}
          <div className="w-36 sm:w-48 h-1.5 rounded-full bg-white/10 overflow-hidden flex mt-1 shadow-inner">
            <div
              className="h-full transition-all duration-700"
              style={{
                width: `${homeXgPercent}%`,
                backgroundColor: homeColor,
                boxShadow: `0 0 8px ${homeColor}aa`,
              }}
            />
            <div
              className="h-full transition-all duration-700"
              style={{
                width: `${awayXgPercent}%`,
                backgroundColor: awayColor,
                boxShadow: `0 0 8px ${awayColor}aa`,
              }}
            />
          </div>
        </div>

        {/* Visitante */}
        <div className="flex flex-col items-center gap-3 flex-1">
          <div className="relative group">
            <div
              className="absolute -inset-3 rounded-full blur-3xl opacity-20 pointer-events-none transition-opacity duration-300 group-hover:opacity-35"
              style={{ backgroundColor: awayColor }}
            />
            <div
              className="relative w-20 h-20 rounded-full flex items-center justify-center border border-white/10 shadow-lg text-xl font-bold bg-white/5 p-2 backdrop-blur-sm transition-transform duration-300 group-hover:scale-105"
              style={{ boxShadow: `0 0 24px -6px ${awayColor}40` }}
            >
              {awayCrest ? <img src={awayCrest} alt={away_team} className="w-full h-full object-contain drop-shadow-md" /> : away_short}
            </div>
          </div>
          <span className="font-semibold text-lg text-center tracking-tight">{away_team}</span>
        </div>
      </div>
    </div>
  );
}


import React from 'react';
import { getTeamCrest, getMatchTeamColors } from '@/utils/crests';
import { useCompetition } from '@/stores/filterStore';

export default function MatchHeader({ matchData, homeColor: propHomeColor, awayColor: propAwayColor }: { matchData: any; homeColor?: string; awayColor?: string }) {
  const { competition } = useCompetition();
  const isUcl = competition === 'ucl';
  const { home_team, home_short, away_team, away_short, home_score, away_score, home_xg, away_xg, date, stadium, status, is_upcoming } = matchData;
  const isUpcoming = status === 'scheduled' || is_upcoming;

  const homeCrest = getTeamCrest(home_team);
  const awayCrest = getTeamCrest(away_team);
  const colors = (propHomeColor && propAwayColor) ? { homeColor: propHomeColor, awayColor: propAwayColor } : getMatchTeamColors(home_team, away_team);
  const homeColor = colors.homeColor;
  const awayColor = colors.awayColor;

  const totalXg = (home_xg || 0) + (away_xg || 0);
  const homeXgPercent = totalXg > 0 ? (home_xg / totalXg) * 100 : 50;
  const awayXgPercent = 100 - homeXgPercent;

  const formattedDate = React.useMemo(() => {
    if (!date) return '';
    try {
      const d = new Date(date);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('es-ES', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        }).replace('.', '');
      }
    } catch {}
    return date;
  }, [date]);

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

      {/* Badge de competición alineado */}
      <div className="absolute top-4 left-4 hidden sm:flex items-center gap-2">
        <div className="inline-flex items-center gap-2 leading-none">
          <span className="h-6 px-2.5 flex items-center justify-center rounded-lg text-xs font-medium whitespace-nowrap bg-white/[0.04] border border-white/10 text-slate-300 gap-1.5 leading-none shadow-sm">
            <span className={`w-1.5 h-1.5 rounded-full ${isUcl ? 'bg-cyan-400 shadow-[0_0_6px_#22d3ee]' : 'bg-emerald-400 shadow-[0_0_6px_#10b981]'}`}></span>
            <span>{isUcl ? 'UEFA Champions League' : 'LaLiga EA Sports'}</span>
          </span>
          <span className="h-6 px-2.5 flex items-center justify-center rounded-lg text-xs font-mono text-slate-400 bg-white/[0.03] border border-white/5 leading-none">
            2026-27
          </span>
        </div>
      </div>

      <div className="absolute top-4 right-4 flex items-center gap-3">
        <span className="h-6 px-2.5 flex items-center justify-center rounded-lg text-xs font-mono text-slate-400 bg-white/[0.02] border border-white/5 leading-none">
          {formattedDate} {stadium ? `· ${stadium}` : ''}
        </span>
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
              {homeCrest ? <img src={homeCrest} alt={home_team} loading="lazy" className="w-full h-full object-contain drop-shadow-md" /> : home_short}
            </div>
          </div>
          <span className="font-semibold text-lg text-center tracking-tight">{home_team}</span>
        </div>

        {/* Marcador y analítica xG */}
        {isUpcoming ? (
          <div className="flex flex-col items-center gap-1.5 px-3 py-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/25 animate-pulse">
              Por Disputar
            </span>
            <div className="text-4xl md:text-5xl font-black font-mono tracking-wider text-slate-200">
              VS
            </div>
            <span className="text-xs font-mono text-slate-400">
              {formattedDate}
            </span>
          </div>
        ) : (
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
                className="h-full spring-bar"
                style={{
                  width: `${homeXgPercent}%`,
                  backgroundColor: homeColor,
                  boxShadow: `0 0 8px ${homeColor}aa`,
                }}
              />
              <div
                className="h-full spring-bar"
                style={{
                  width: `${awayXgPercent}%`,
                  backgroundColor: awayColor,
                  boxShadow: `0 0 8px ${awayColor}aa`,
                }}
              />
            </div>
          </div>
        )}

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
              {awayCrest ? <img src={awayCrest} alt={away_team} loading="lazy" className="w-full h-full object-contain drop-shadow-md" /> : away_short}
            </div>
          </div>
          <span className="font-semibold text-lg text-center tracking-tight">{away_team}</span>
        </div>
      </div>
    </div>
  );
}


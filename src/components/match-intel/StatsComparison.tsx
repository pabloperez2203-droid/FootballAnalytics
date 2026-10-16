"use client";

import React from 'react';
import { getTeamCrest, getMatchTeamColors } from '@/utils/crests';

interface StatsComparisonProps {
  stats?: any;
  shots?: any[];
  homeTeam?: string;
  awayTeam?: string;
  homeScore?: number;
  awayScore?: number;
  homeColor?: string;
  awayColor?: string;
}

export default function StatsComparison({
  stats,
  shots = [],
  homeTeam = 'Local',
  awayTeam = 'Visitante',
  homeScore,
  awayScore,
  homeColor: propHomeColor,
  awayColor: propAwayColor
}: StatsComparisonProps) {
  const colors = (propHomeColor && propAwayColor)
    ? { homeColor: propHomeColor, awayColor: propAwayColor }
    : getMatchTeamColors(homeTeam, awayTeam);
  const homeColor = colors.homeColor;
  const awayColor = colors.awayColor;

  const homeCrest = getTeamCrest(homeTeam);
  const awayCrest = getTeamCrest(awayTeam);

  // Helper filters
  const homeShots = shots.filter(s => s.team === 'home');
  const awayShots = shots.filter(s => s.team === 'away');

  const isOnTarget = (s: any) => {
    const res = String(s.result || '').toLowerCase();
    return res === 'gol' || res === 'goal' || res === 'parada' || res === 'savedshot';
  };

  const isInsideBox = (s: any) => {
    const x = Number(s.x);
    if (isNaN(x)) return false;
    return x >= 83 || x <= 17;
  };

  // 1) Goles
  const homeGoals = homeScore !== undefined ? homeScore : homeShots.filter(s => String(s.result).toLowerCase() === 'gol' || String(s.result).toLowerCase() === 'goal').length;
  const awayGoals = awayScore !== undefined ? awayScore : awayShots.filter(s => String(s.result).toLowerCase() === 'gol' || String(s.result).toLowerCase() === 'goal').length;

  // 2) Goles Esperados (xG)
  const homeXg = stats?.home?.xg !== undefined
    ? Number(stats.home.xg)
    : homeShots.reduce((acc, s) => acc + (Number(s.xg) || 0), 0);
  const awayXg = stats?.away?.xg !== undefined
    ? Number(stats.away.xg)
    : awayShots.reduce((acc, s) => acc + (Number(s.xg) || 0), 0);

  // 3) Diferencial de Pegada (G - xG)
  const homeDelta = homeGoals - homeXg;
  const awayDelta = awayGoals - awayXg;

  // 4) Tiros Totales
  const homeTotalShots = homeShots.length > 0 ? homeShots.length : (stats?.home?.shots || 0);
  const awayTotalShots = awayShots.length > 0 ? awayShots.length : (stats?.away?.shots || 0);

  // 5) Tiros a Puerta
  const homeOnTarget = homeShots.filter(isOnTarget).length;
  const awayOnTarget = awayShots.filter(isOnTarget).length;

  // 6) Grandes Ocasiones (xG >= 0.25)
  const homeBigChances = homeShots.filter(s => (Number(s.xg) || 0) >= 0.25).length;
  const awayBigChances = awayShots.filter(s => (Number(s.xg) || 0) >= 0.25).length;

  // 7) Tiros dentro del Área
  const homeBoxShots = homeShots.filter(isInsideBox).length;
  const awayBoxShots = awayShots.filter(isInsideBox).length;

  // 8) Peligro Medio (xG / Tiro)
  const homeAvgXg = homeTotalShots > 0 ? homeXg / homeTotalShots : 0;
  const awayAvgXg = awayTotalShots > 0 ? awayXg / awayTotalShots : 0;

  // Nivel 1: Métricas Clave (3 Tarjetas destacadas arriba)
  const primaryMetrics = [
    {
      id: 'xg',
      label: 'Goles Esperados (xG)',
      homeVal: homeXg,
      awayVal: awayXg,
      homeDisplay: homeXg.toFixed(2),
      awayDisplay: awayXg.toFixed(2),
      decimals: 2
    },
    {
      id: 'bigChances',
      label: 'Grandes Ocasiones',
      homeVal: homeBigChances,
      awayVal: awayBigChances,
      homeDisplay: homeBigChances.toString(),
      awayDisplay: awayBigChances.toString(),
      decimals: 0
    },
    {
      id: 'delta',
      label: 'Diferencial (G − xG)',
      homeVal: homeDelta,
      awayVal: awayDelta,
      homeDisplay: (homeDelta >= 0 ? '+' : '') + homeDelta.toFixed(2),
      awayDisplay: (awayDelta >= 0 ? '+' : '') + awayDelta.toFixed(2),
      decimals: 2,
      isDelta: true
    }
  ];

  // Nivel 2: Métricas Secundarias (Grid 2x2 compacto)
  const secondaryMetrics = [
    {
      id: 'shots',
      label: 'Tiros Totales',
      homeVal: homeTotalShots,
      awayVal: awayTotalShots,
      homeDisplay: homeTotalShots.toString(),
      awayDisplay: awayTotalShots.toString(),
      decimals: 0
    },
    {
      id: 'onTarget',
      label: 'Tiros a Puerta',
      homeVal: homeOnTarget,
      awayVal: awayOnTarget,
      homeDisplay: homeOnTarget.toString(),
      awayDisplay: awayOnTarget.toString(),
      decimals: 0
    },
    {
      id: 'boxShots',
      label: 'Tiros en el Área',
      homeVal: homeBoxShots,
      awayVal: awayBoxShots,
      homeDisplay: homeBoxShots.toString(),
      awayDisplay: awayBoxShots.toString(),
      decimals: 0
    },
    {
      id: 'avgXg',
      label: 'xG / Tiro (Peligro)',
      homeVal: homeAvgXg,
      awayVal: awayAvgXg,
      homeDisplay: homeAvgXg.toFixed(2),
      awayDisplay: awayAvgXg.toFixed(2),
      decimals: 2
    }
  ];

  // Helper calculation for Tug-of-War bar width
  const getPercentages = (homeVal: number, awayVal: number, isDelta?: boolean) => {
    let homePct = 50;
    if (isDelta) {
      const minVal = Math.min(homeVal, awayVal, 0);
      const shiftedH = homeVal - minVal + 0.1;
      const shiftedA = awayVal - minVal + 0.1;
      const total = shiftedH + shiftedA;
      homePct = total > 0 ? (shiftedH / total) * 100 : 50;
    } else {
      const total = homeVal + awayVal;
      homePct = total > 0 ? (homeVal / total) * 100 : 50;
    }
    const clampedH = Math.min(Math.max(homePct, 12), 88);
    return { homePct: clampedH, awayPct: 100 - clampedH };
  };

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 h-full flex flex-col transition-all duration-300 hover:-translate-y-0.5">
      {/* Header Compacto con Equipos y Colores con contraste garantizado */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3.5">
        <div className="flex items-center gap-2.5">
          {homeCrest ? (
            <img src={homeCrest} alt={homeTeam} className="w-7 h-7 object-contain drop-shadow" />
          ) : (
            <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] text-white" style={{ backgroundColor: homeColor }}>
              {homeTeam.substring(0, 2)}
            </div>
          )}
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-white leading-tight">{homeTeam}</h3>
            <span className="text-[10px] font-mono text-slate-400">Local</span>
          </div>
        </div>

        <div className="text-center px-2">
          <span className="text-[10px] uppercase tracking-wider font-mono text-slate-400 font-semibold px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
            Comparativa de Métricas
          </span>
        </div>

        <div className="flex items-center gap-2.5 flex-row-reverse text-right">
          {awayCrest ? (
            <img src={awayCrest} alt={awayTeam} className="w-7 h-7 object-contain drop-shadow" />
          ) : (
            <div className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] text-white" style={{ backgroundColor: awayColor }}>
              {awayTeam.substring(0, 2)}
            </div>
          )}
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-white leading-tight">{awayTeam}</h3>
            <span className="text-[10px] font-mono text-slate-400">Visitante</span>
          </div>
        </div>
      </div>

      {/* NIVEL 1: 3 Métricas Clave Destacadas en fila */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 mb-3.5">
        {primaryMetrics.map(m => {
          const homeWins = m.homeVal > m.awayVal;
          const awayWins = m.awayVal > m.homeVal;
          const { homePct, awayPct } = getPercentages(m.homeVal, m.awayVal, m.isDelta);

          return (
            <div key={m.id} className="bg-slate-900/60 rounded-xl p-3 border border-white/10 flex flex-col justify-between">
              <div className="text-[11px] font-semibold text-slate-300 text-center mb-1.5">
                {m.label}
              </div>

              {/* Números grandes enfrentados */}
              <div className="flex items-baseline justify-between mb-2">
                <div className="flex items-center gap-1">
                  <span className={`text-base sm:text-lg font-mono font-bold ${homeWins ? 'text-white' : 'text-slate-400'}`}>
                    {m.homeDisplay}
                  </span>
                  {homeWins && (
                    <span
                      className="text-[9px] font-mono font-bold px-1 py-0.2 rounded"
                      style={{ backgroundColor: `${homeColor}33`, color: homeColor, border: `1px solid ${homeColor}66` }}
                    >
                      +{m.isDelta ? (m.homeVal - m.awayVal).toFixed(2) : (m.decimals === 0 ? (m.homeVal - m.awayVal) : (m.homeVal - m.awayVal).toFixed(2))}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 flex-row-reverse">
                  <span className={`text-base sm:text-lg font-mono font-bold ${awayWins ? 'text-white' : 'text-slate-400'}`}>
                    {m.awayDisplay}
                  </span>
                  {awayWins && (
                    <span
                      className="text-[9px] font-mono font-bold px-1 py-0.2 rounded"
                      style={{ backgroundColor: `${awayColor}33`, color: awayColor, border: `1px solid ${awayColor}66` }}
                    >
                      +{m.isDelta ? (m.awayVal - m.homeVal).toFixed(2) : (m.decimals === 0 ? (m.awayVal - m.homeVal) : (m.awayVal - m.homeVal).toFixed(2))}
                    </span>
                  )}
                </div>
              </div>

              {/* Barra fina */}
              <div className="w-full h-1.5 bg-slate-950 rounded-full flex overflow-hidden border border-white/5">
                <div
                  className="h-full rounded-l-full transition-all duration-500"
                  style={{
                    width: `${homePct}%`,
                    backgroundColor: homeColor,
                    filter: homeWins ? 'brightness(1.15)' : 'brightness(0.75)'
                  }}
                />
                <div className="w-0.5 h-full bg-slate-950 shrink-0" />
                <div
                  className="h-full rounded-r-full transition-all duration-500"
                  style={{
                    width: `${awayPct}%`,
                    backgroundColor: awayColor,
                    filter: awayWins ? 'brightness(1.15)' : 'brightness(0.75)'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* NIVEL 2: Métricas Secundarias en Grid 2x2 muy compacto */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
        {secondaryMetrics.map(m => {
          const homeWins = m.homeVal > m.awayVal;
          const awayWins = m.awayVal > m.homeVal;
          const { homePct, awayPct } = getPercentages(m.homeVal, m.awayVal);

          return (
            <div key={m.id} className="bg-slate-900/30 rounded-lg px-2.5 py-1.5 border border-white/5 hover:border-white/10 transition-colors">
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-1 font-mono">
                  <span className={`text-xs font-semibold ${homeWins ? 'text-white' : 'text-slate-400'}`}>
                    {m.homeDisplay}
                  </span>
                  {homeWins && (
                    <span
                      className="text-[8px] font-mono font-bold px-1 rounded"
                      style={{ backgroundColor: `${homeColor}25`, color: homeColor }}
                    >
                      +{m.decimals === 0 ? (m.homeVal - m.awayVal) : (m.homeVal - m.awayVal).toFixed(2)}
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-300 font-medium text-center">
                  {m.label}
                </div>

                <div className="flex items-center gap-1 font-mono flex-row-reverse">
                  <span className={`text-xs font-semibold ${awayWins ? 'text-white' : 'text-slate-400'}`}>
                    {m.awayDisplay}
                  </span>
                  {awayWins && (
                    <span
                      className="text-[8px] font-mono font-bold px-1 rounded"
                      style={{ backgroundColor: `${awayColor}25`, color: awayColor }}
                    >
                      +{m.decimals === 0 ? (m.awayVal - m.homeVal) : (m.awayVal - m.homeVal).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Barra muy fina (h-1.5) */}
              <div className="w-full h-1.5 bg-slate-950 rounded-full flex overflow-hidden border border-white/5">
                <div
                  className="h-full rounded-l-full transition-all duration-500"
                  style={{
                    width: `${homePct}%`,
                    backgroundColor: homeColor,
                    filter: homeWins ? 'brightness(1.15)' : 'brightness(0.75)'
                  }}
                />
                <div className="w-0.5 h-full bg-slate-950 shrink-0" />
                <div
                  className="h-full rounded-r-full transition-all duration-500"
                  style={{
                    width: `${awayPct}%`,
                    backgroundColor: awayColor,
                    filter: awayWins ? 'brightness(1.15)' : 'brightness(0.75)'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

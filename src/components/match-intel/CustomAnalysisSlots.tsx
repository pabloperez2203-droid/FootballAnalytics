"use client";
import React, { useMemo } from 'react';
import equiposData from '@/data/equipos_xg.json';
import { getTeamColor } from '@/utils/crests';

interface CustomAnalysisSlotsProps {
  shots: any[];
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  stats?: any;
}

export default function CustomAnalysisSlots({
  shots = [],
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  stats,
}: CustomAnalysisSlotsProps) {
  const homeColor = getTeamColor(homeTeam);
  const awayColor = getTeamColor(awayTeam);

  // ─── Slot 1: Simulador Monte Carlo (5.000 iteraciones) ─────────────────
  const monteCarlo = useMemo(() => {
    if (!shots || shots.length === 0) {
      return {
        homeWinPct: 33.3,
        drawPct: 33.4,
        awayWinPct: 33.3,
        mostLikelyScore: "0 - 0",
        mostLikelyScorePct: 0,
        justiceVerdict: "Datos de tiros insuficientes para la simulación",
      };
    }

    const SIMS = 5000;
    let homeWins = 0;
    let draws = 0;
    let awayWins = 0;
    const scoreMap: Record<string, number> = {};

    const homeShots = shots.filter(s => s.team === 'home');
    const awayShots = shots.filter(s => s.team === 'away');

    for (let i = 0; i < SIMS; i++) {
      let hGoals = 0;
      let aGoals = 0;

      for (let j = 0; j < homeShots.length; j++) {
        if (Math.random() < Number(homeShots[j].xg || 0)) {
          hGoals++;
        }
      }

      for (let k = 0; k < awayShots.length; k++) {
        if (Math.random() < Number(awayShots[k].xg || 0)) {
          aGoals++;
        }
      }

      if (hGoals > aGoals) homeWins++;
      else if (aGoals > hGoals) awayWins++;
      else draws++;

      const key = `${hGoals} - ${aGoals}`;
      scoreMap[key] = (scoreMap[key] || 0) + 1;
    }

    let topScore = "0 - 0";
    let topScoreCount = 0;
    for (const [score, count] of Object.entries(scoreMap)) {
      if (count > topScoreCount) {
        topScoreCount = count;
        topScore = score;
      }
    }

    const homePct = (homeWins / SIMS) * 100;
    const drawPct = (draws / SIMS) * 100;
    const awayPct = (awayWins / SIMS) * 100;
    const topScorePct = (topScoreCount / SIMS) * 100;

    let justice = "Resultado acorde a la producción de ocasiones creada.";
    if (homeScore !== undefined && awayScore !== undefined) {
      const realWinner = homeScore > awayScore ? 'home' : awayScore > homeScore ? 'away' : 'draw';
      const expectedWinner = homePct > awayPct && homePct > drawPct ? 'home' : awayPct > homePct && awayPct > drawPct ? 'away' : 'draw';

      if (realWinner === expectedWinner) {
        justice = "Marcador justo: la distribución estocástica respalda el desenlace real.";
      } else {
        justice = "Anomalía de efectividad: el resultado real desafió las probabilidades estadísticas.";
      }
    }

    return {
      homeWinPct: Number(homePct.toFixed(1)),
      drawPct: Number(drawPct.toFixed(1)),
      awayWinPct: Number(awayPct.toFixed(1)),
      mostLikelyScore: topScore,
      mostLikelyScorePct: Number(topScorePct.toFixed(1)),
      justiceVerdict: justice,
    };
  }, [shots, homeScore, awayScore]);

  // ─── Slot 2: Dominio Territorial e Intensidad ──────────────────────────
  const territory = useMemo(() => {
    const normalize = (name: string) =>
      name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    const hData = equiposData.find(e => normalize(e.team) === normalize(homeTeam));
    const aData = equiposData.find(e => normalize(e.team) === normalize(awayTeam));

    // PPDA: menor número = presión más alta / asfixiante
    const hPpda = stats?.home?.ppda || (hData ? Number(hData.ppda_avg.toFixed(1)) : 10.4);
    const aPpda = stats?.away?.ppda || (aData ? Number(aData.ppda_avg.toFixed(1)) : 11.2);

    // Deep completions por partido
    const hDeep = stats?.home?.deep_completions || (hData ? Math.round(hData.deep_completions / hData.matches_played) : 6);
    const aDeep = stats?.away?.deep_completions || (aData ? Math.round(aData.deep_completions / aData.matches_played) : 5);

    const getPpdaLabel = (val: number) => {
      if (val < 9.5) return { text: "Presión Alta", color: "#10b981", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25" };
      if (val <= 12.0) return { text: "Presión Media", color: "#38bdf8", badge: "bg-sky-500/10 text-sky-400 border-sky-500/25" };
      return { text: "Bloque Bajo", color: "#f97316", badge: "bg-orange-500/10 text-orange-400 border-orange-500/25" };
    };

    const hPpdaInfo = getPpdaLabel(hPpda);
    const aPpdaInfo = getPpdaLabel(aPpda);

    return {
      hPpda,
      aPpda,
      hPpdaInfo,
      aPpdaInfo,
      hDeep,
      aDeep,
    };
  }, [stats, homeTeam, awayTeam]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* ─── Módulo 1: Simulador Monte Carlo (Justicia del Resultado) ──────── */}
      <div className="glass-card rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="lbl font-semibold">Simulador Monte Carlo</div>
              <h3 className="font-bold text-white text-base mt-0.5">Justicia del Resultado</h3>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-slate-400">
              5.000 Simulaciones
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed mb-5">
            Probabilidad de resultado basada en el valor <span className="text-slate-200 font-mono font-medium">xG</span> de cada disparo efectuado en el partido.
          </p>

          {/* Barra tricolor divergente */}
          <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-900 border border-white/10 mb-4 shadow-inner">
            <div
              className="h-full transition-all duration-700"
              style={{
                width: `${monteCarlo.homeWinPct}%`,
                backgroundColor: homeColor,
                boxShadow: `0 0 10px ${homeColor}80`,
              }}
              title={`${homeTeam}: ${monteCarlo.homeWinPct}%`}
            />
            <div
              className="h-full bg-slate-600/80 transition-all duration-700 border-x border-slate-800"
              style={{ width: `${monteCarlo.drawPct}%` }}
              title={`Empate: ${monteCarlo.drawPct}%`}
            />
            <div
              className="h-full transition-all duration-700"
              style={{
                width: `${monteCarlo.awayWinPct}%`,
                backgroundColor: awayColor,
                boxShadow: `0 0 10px ${awayColor}80`,
              }}
              title={`${awayTeam}: ${monteCarlo.awayWinPct}%`}
            />
          </div>

          {/* Estadísticas de probabilidad */}
          <div className="grid grid-cols-3 gap-2 text-center mb-5">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="lbl text-[10px] block truncate">{homeTeam}</span>
              <span className="font-mono text-lg sm:text-xl font-bold tabular-nums text-white mt-1 block">
                {monteCarlo.homeWinPct}%
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="lbl text-[10px] block">Empate</span>
              <span className="font-mono text-lg sm:text-xl font-bold tabular-nums text-slate-300 mt-1 block">
                {monteCarlo.drawPct}%
              </span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="lbl text-[10px] block truncate">{awayTeam}</span>
              <span className="font-mono text-lg sm:text-xl font-bold tabular-nums text-white mt-1 block">
                {monteCarlo.awayWinPct}%
              </span>
            </div>
          </div>
        </div>

        {/* Footer del Slot 1: Marcador más probable y Veredicto */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-400">Marcador más probable: </span>
            <span className="font-mono font-bold text-white text-sm">
              {monteCarlo.mostLikelyScore}
            </span>
            <span className="text-slate-500 text-[11px] font-mono ml-1">
              ({monteCarlo.mostLikelyScorePct}%)
            </span>
          </div>
          <span className="text-[11px] text-slate-300 bg-white/[0.04] px-2.5 py-1 rounded-md border border-white/5">
            {monteCarlo.justiceVerdict}
          </span>
        </div>
      </div>

      {/* ─── Módulo 2: Dominio Territorial e Intensidad (PPDA & Deep) ──────── */}
      <div className="glass-card rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="lbl font-semibold">Táctica Avanzada</div>
              <h3 className="font-bold text-white text-base mt-0.5">Dominio Territorial e Intensidad</h3>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-slate-400">
              PPDA & Ocupación
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed mb-5">
            El <strong className="text-slate-200">PPDA</strong> evalúa pases rivales permitidos por acción defensiva (menor valor indica presión asfixiante). Los <strong className="text-slate-200">Deep Completions</strong> miden llegadas exitosas al área.
          </p>

          <div className="space-y-5">
            {/* Medidor PPDA */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">Intensidad de Presión (PPDA)</span>
                <span className="text-[10px] text-slate-500 font-mono">Menor = Más presión</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Local PPDA */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-slate-400 truncate">{homeTeam}</span>
                    <span className="font-mono font-bold text-white">{territory.hPpda}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(10, (20 - territory.hPpda) * 7))}%`,
                        backgroundColor: homeColor,
                      }}
                    />
                  </div>
                  <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${territory.hPpdaInfo.badge}`}>
                    {territory.hPpdaInfo.text}
                  </span>
                </div>

                {/* Visitante PPDA */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-slate-400 truncate">{awayTeam}</span>
                    <span className="font-mono font-bold text-white">{territory.aPpda}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(10, (20 - territory.aPpda) * 7))}%`,
                        backgroundColor: awayColor,
                      }}
                    />
                  </div>
                  <span className={`inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${territory.aPpdaInfo.badge}`}>
                    {territory.aPpdaInfo.text}
                  </span>
                </div>
              </div>
            </div>

            {/* Medidor Deep Completions */}
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">Deep Completions (Pases al Área Rival)</span>
                <span className="text-[10px] text-slate-500 font-mono">Último tercio</span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono font-bold mb-1.5">
                <span style={{ color: homeColor }}>{homeTeam}: {territory.hDeep}</span>
                <span style={{ color: awayColor }}>{awayTeam}: {territory.aDeep}</span>
              </div>

              {/* Barra comparativa proporcional */}
              <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-900">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${(territory.hDeep / ((territory.hDeep + territory.aDeep) || 1)) * 100}%`,
                    backgroundColor: homeColor,
                  }}
                />
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${(territory.aDeep / ((territory.hDeep + territory.aDeep) || 1)) * 100}%`,
                    backgroundColor: awayColor,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer del Slot 2: Diagnóstico táctico */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>Diagnóstico territorial:</span>
          <span className="font-semibold text-slate-200">
            {territory.hDeep > territory.aDeep
              ? `Mayor asedio en área por ${homeTeam}`
              : territory.aDeep > territory.hDeep
              ? `Mayor asedio en área por ${awayTeam}`
              : "Llegadas al área equilibradas"}
          </span>
        </div>
      </div>
    </div>
  );
}

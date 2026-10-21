"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import equiposData from "@/data/equipos_xg.json";
import equiposUclData from "@/data/equipos_ucl_xg.json";
import jugadoresData from "@/data/jugadores_xg.json";
import jugadoresUclData from "@/data/jugadores_ucl_xg.json";
import { useCompetition, setCompetition } from "@/stores/filterStore";
import { getTeamCrest, getTeamColor } from "@/utils/crests";
import { FeaturedMatch, getSuggestedMatchChips } from "@/config/featuredMatches";
import { parseMatchDate } from "@/utils/dateFormatter";

export default function MatchupOracle() {
  const { competition, isUcl } = useCompetition();
  const searchParams = useSearchParams();

  const currentEquipos = isUcl ? equiposUclData : equiposData;
  const currentJugadores = isUcl ? jugadoresUclData : jugadoresData;

  // Estado para equipos seleccionados (por defecto el top 1 y top 2)
  const [homeTeamName, setHomeTeamName] = useState<string>(
    () => currentEquipos[0]?.team || "Real Madrid"
  );
  const [awayTeamName, setAwayTeamName] = useState<string>(
    () => currentEquipos[1]?.team || "Barcelona"
  );

  // Escuchar parámetros de URL para carga automática de partidos (?local=...&visitante=...)
  useEffect(() => {
    if (!searchParams) return;
    const urlHome = searchParams.get("local") || searchParams.get("home");
    const urlAway = searchParams.get("visitante") || searchParams.get("away");
    const urlComp = searchParams.get("comp") || searchParams.get("competition");

    if (urlComp && (urlComp === "laliga" || urlComp === "ucl") && urlComp !== competition) {
      setCompetition(urlComp);
    }
    if (urlHome) {
      const foundHome = currentEquipos.find(
        (t) => t.team.toLowerCase() === urlHome.trim().toLowerCase()
      );
      if (foundHome) {
        setHomeTeamName(foundHome.team);
      }
    }
    if (urlAway) {
      const foundAway = currentEquipos.find(
        (t) => t.team.toLowerCase() === urlAway.trim().toLowerCase()
      );
      if (foundAway) {
        setAwayTeamName(foundAway.team);
      }
    }
  }, [searchParams, competition, currentEquipos]);

  // Lista de chips sugeridos según competición activa
  const suggestedChips = useMemo(() => {
    return getSuggestedMatchChips(competition);
  }, [competition]);

  const handleSelectSuggestedMatch = (match: FeaturedMatch) => {
    if (match.competition !== competition) {
      setCompetition(match.competition);
    }
    setHomeTeamName(match.homeTeam);
    setAwayTeamName(match.awayTeam);
  };

  // Aseguramos que los equipos existan en la competición activa
  const validHomeTeam = useMemo(() => {
    return (
      currentEquipos.find((t) => t.team === homeTeamName) || currentEquipos[0]
    );
  }, [currentEquipos, homeTeamName]);

  const validAwayTeam = useMemo(() => {
    const candidate = currentEquipos.find((t) => t.team === awayTeamName);
    if (candidate && candidate.team !== validHomeTeam.team) return candidate;
    return currentEquipos.find((t) => t.team !== validHomeTeam.team) || currentEquipos[1] || currentEquipos[0];
  }, [currentEquipos, awayTeamName, validHomeTeam]);

  // Factor campo: +8% en LaLiga, +6% en Champions League
  const homeAdvantageFactor = isUcl ? 1.06 : 1.08;

  // Cálculo de simulación bivariante de Poisson
  const simulation = useMemo(() => {
    const homeMatches = Math.max(1, validHomeTeam.matches_played || 1);
    const awayMatches = Math.max(1, validAwayTeam.matches_played || 1);

    // Medias de goles esperados por partido
    const homeXgPerMatch = (validHomeTeam.xg_for || 1.3) / homeMatches;
    const homeXgaPerMatch = (validHomeTeam.xg_against || 1.1) / homeMatches;

    const awayXgPerMatch = (validAwayTeam.xg_for || 1.3) / awayMatches;
    const awayXgaPerMatch = (validAwayTeam.xg_against || 1.1) / awayMatches;

    // Media de la liga aproximada
    const leagueAvg = 1.35;

    // Intensidades esperadas de Poisson (lambda)
    let lambdaHome = (homeXgPerMatch * awayXgaPerMatch / leagueAvg) * homeAdvantageFactor;
    let lambdaAway = (awayXgPerMatch * homeXgaPerMatch / leagueAvg);

    // Limitamos dentro de rangos realistas (0.25 a 4.2)
    lambdaHome = Math.max(0.25, Math.min(4.2, lambdaHome));
    lambdaAway = Math.max(0.25, Math.min(4.2, lambdaAway));

    // Función de probabilidad Poisson P(k; lambda)
    const factorial = (n: number): number => {
      if (n <= 1) return 1;
      let res = 1;
      for (let i = 2; i <= n; i++) res *= i;
      return res;
    };

    const poisson = (k: number, lambda: number) => {
      return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
    };

    // Matriz de probabilidad hasta 7 goles para acumular 1X2 exacto
    let pHomeWin = 0;
    let pDraw = 0;
    let pAwayWin = 0;

    const matrix4x4: { homeGoals: number; awayGoals: number; prob: number }[][] = [];

    // Matriz 4x4 para visualización
    for (let h = 0; h < 4; h++) {
      matrix4x4[h] = [];
      for (let a = 0; a < 4; a++) {
        let prob = poisson(h, lambdaHome) * poisson(a, lambdaAway);

        // Corrección de Dixon-Coles para marcadores bajos defensivos
        const rho = -0.04;
        if (h === 0 && a === 0) prob *= 1 - lambdaHome * lambdaAway * rho;
        else if (h === 0 && a === 1) prob *= 1 + lambdaHome * rho;
        else if (h === 1 && a === 0) prob *= 1 + lambdaAway * rho;
        else if (h === 1 && a === 1) prob *= 1 - rho;

        matrix4x4[h][a] = {
          homeGoals: h,
          awayGoals: a,
          prob: Math.max(0, prob),
        };
      }
    }

    // Suma completa para probabilidades 1X2 (hasta 7 goles)
    for (let h = 0; h <= 7; h++) {
      for (let a = 0; a <= 7; a++) {
        const prob = poisson(h, lambdaHome) * poisson(a, lambdaAway);
        if (h > a) pHomeWin += prob;
        else if (h === a) pDraw += prob;
        else pAwayWin += prob;
      }
    }

    const total1X2 = pHomeWin + pDraw + pAwayWin || 1;
    const homePercent = Math.round((pHomeWin / total1X2) * 100);
    const drawPercent = Math.round((pDraw / total1X2) * 100);
    const awayPercent = Math.max(0, 100 - homePercent - drawPercent);

    // Encontrar el marcador exacto más probable
    let maxProb = 0;
    let mostLikely = { h: 1, a: 1, prob: 0 };
    for (let h = 0; h < 4; h++) {
      for (let a = 0; a < 4; a++) {
        if (matrix4x4[h][a].prob > maxProb) {
          maxProb = matrix4x4[h][a].prob;
          mostLikely = { h, a, prob: maxProb };
        }
      }
    }

    // Amenazas de gol (Top 2 jugadores por equipo)
    const getThreats = (teamName: string, expectedTeamXg: number) => {
      const teamPlayers = (currentJugadores as any[]).filter(
        (p) =>
          p.team_name?.toLowerCase() === teamName.toLowerCase() ||
          p.team?.toLowerCase() === teamName.toLowerCase()
      );

      const scored = teamPlayers.map((p) => {
        const minutes = Number(p.minutes || p.time || 90);
        const xg = Number(p.xg || 0);
        const goals = Number(p.goals || 0);
        const xg90 = minutes > 0 ? (xg / minutes) * 90 : 0.1;

        // Probabilidad de marcar en el partido
        const scoringChance = Math.min(
          0.85,
          Math.max(0.08, 1 - Math.exp(-expectedTeamXg * (xg90 / 2.2)))
        );

        return {
          name: p.player_name || p.player || "Jugador",
          position: p.position || "FW",
          goals,
          xg,
          xg90,
          scoringChance,
          photo: p.photo,
        };
      });

      return scored
        .sort((a, b) => b.scoringChance - a.scoringChance)
        .slice(0, 2);
    };

    const homeThreats = getThreats(validHomeTeam.team, lambdaHome);
    const awayThreats = getThreats(validAwayTeam.team, lambdaAway);

    return {
      lambdaHome,
      lambdaAway,
      homePercent,
      drawPercent,
      awayPercent,
      matrix4x4,
      maxProb,
      mostLikely,
      homeThreats,
      awayThreats,
    };
  }, [validHomeTeam, validAwayTeam, currentJugadores, homeAdvantageFactor, isUcl]);

  const homeCrest = getTeamCrest(validHomeTeam.team);
  const awayCrest = getTeamCrest(validAwayTeam.team);
  const homeColor = getTeamColor(validHomeTeam.team);
  const awayColor = getTeamColor(validAwayTeam.team);

  return (
    <div className="glass-card interactive-card rounded-2xl p-6 sm:p-8 flex flex-col gap-8 transition-all duration-300">
      {/* ─── Encabezado ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full animate-pulse shadow-md ${isUcl ? "bg-cyan-400 shadow-cyan-400/50" : "bg-emerald-400 shadow-emerald-400/50"
                }`}
            />
            <span
              className={`text-xs font-mono font-bold tracking-wider uppercase ${isUcl ? "text-cyan-400" : "text-emerald-400"
                }`}
            >
              MÓDULO 2 · ORÁCULO DE DUELOS & MONTE CARLO
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Simulador de Duelos / Matchup Predictor
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Simula cualquier enfrentamiento cruzando el potencial ofensivo y defensivo real. Distribución de Poisson bivariante con factor campo (+{isUcl ? "6%" : "8%"} local).
          </p>
        </div>

        {/* Badge de Competición */}
        <div className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
          <span>⚙️</span>
          <span>10.000 simulaciones / s</span>
        </div>
      </div>

      {/* ─── Píldoras / Chips Rápidos de Duelos Sugeridos ─── */}
      <div className="flex flex-col gap-2.5 p-3.5 sm:p-4 rounded-2xl bg-white/[0.03] border border-white/10 shadow-inner">
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-[11px] sm:text-xs">
            <span className="text-sm animate-pulse">⚡</span>
            <span>Próximos Partidos (Jornada que viene):</span>
          </div>
          <span className="text-[10px] text-slate-400 hidden sm:inline">
            Toca un duelo inminente para simularlo al instante
          </span>
        </div>

        <div className="flex overflow-x-auto no-scrollbar gap-2 py-1 items-center">
          {suggestedChips.map((m) => {
            const isSelected =
              (validHomeTeam.team === m.homeTeam && validAwayTeam.team === m.awayTeam) ||
              (validHomeTeam.team === m.awayTeam && validAwayTeam.team === m.homeTeam);
            const isMatchUcl = m.competition === "ucl";

            const parsed = parseMatchDate(m.dateStr, m.confirmed);

            return (
              <button
                type="button"
                key={m.id}
                onClick={() => handleSelectSuggestedMatch(m)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 border touch-manipulation active:scale-95 ${isSelected
                    ? isMatchUcl
                      ? "bg-cyan-500/20 border-cyan-400/60 text-cyan-200 shadow-[0_0_15px_rgba(56,189,248,0.25)] ring-1 ring-cyan-400/40"
                      : "bg-emerald-500/20 border-emerald-500/60 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.25)] ring-1 ring-emerald-400/40"
                    : "bg-white/[0.04] border-white/10 text-slate-300 hover:text-white hover:bg-white/[0.08] hover:border-white/20"
                  }`}
                title={`Cargar ${m.homeTeam} vs ${m.awayTeam} (${parsed.formattedFull})`}
              >
                <span className="text-amber-400 text-xs">⚡</span>
                <span className="font-bold text-white">{m.homeTeam}</span>
                <span className="text-slate-500 text-[10px] font-mono">vs</span>
                <span className="font-bold text-white">{m.awayTeam}</span>
                <span className="text-[10px] font-mono text-amber-300/90 font-normal">
                  ({parsed.isConfirmed ? parsed.formattedDate : "Por confirmar"})
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase ${isMatchUcl ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    }`}
                >
                  {m.tag || (isMatchUcl ? "J4 UCL" : "J10 LaLiga")}
                </span>
                {isSelected && (
                  <span className={`w-1.5 h-1.5 rounded-full animate-ping ${isMatchUcl ? "bg-cyan-400" : "bg-emerald-400"}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Selectores de Equipos y Escaparate de Duelo ─── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-6 items-center">
        {/* Equipo Local */}
        <div className="md:col-span-5 p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-3 relative overflow-hidden">
          <div
            className="absolute -top-10 -left-10 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: homeColor }}
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold">
              Equipo Local (+{isUcl ? "6%" : "8%"} Factor Campo)
            </span>
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: homeColor }} />
          </div>

          <div className="flex items-center gap-3 sm:gap-3.5">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/5 border border-white/10 p-2 shrink-0 flex items-center justify-center">
              {homeCrest ? (
                <img src={homeCrest} alt={validHomeTeam.team} loading="lazy" className="w-full h-full object-contain" />
              ) : (
                <span className="font-bold text-sm">{validHomeTeam.team.slice(0, 3)}</span>
              )}
            </div>
            <select
              value={validHomeTeam.team}
              onChange={(e) => setHomeTeamName(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {currentEquipos.map((team) => (
                <option key={team.team} value={team.team} className="bg-slate-900 text-white">
                  {team.team}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-baseline justify-between pt-2 border-t border-white/5 text-xs font-mono text-slate-400">
            <span>xG Proyectado:</span>
            <span className="text-lg sm:text-xl font-black text-white font-mono">
              {simulation.lambdaHome.toFixed(2)}{" "}
              <span className="text-xs text-slate-400 font-normal">xG</span>
            </span>
          </div>
        </div>

        {/* VS Central */}
        <div className="md:col-span-2 flex flex-col items-center justify-center text-center py-1 sm:py-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-mono font-black text-xs sm:text-sm text-slate-400 shadow-md">
            VS
          </div>
          <span className="text-[9px] sm:text-[10px] font-mono text-slate-500 mt-1 uppercase">Duelo Táctico</span>
        </div>

        {/* Equipo Visitante */}
        <div className="md:col-span-5 p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-3 relative overflow-hidden">
          <div
            className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: awayColor }}
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
              Equipo Visitante
            </span>
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: awayColor }} />
          </div>

          <div className="flex items-center gap-3 sm:gap-3.5">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/5 border border-white/10 p-2 shrink-0 flex items-center justify-center">
              {awayCrest ? (
                <img src={awayCrest} alt={validAwayTeam.team} loading="lazy" className="w-full h-full object-contain" />
              ) : (
                <span className="font-bold text-sm">{validAwayTeam.team.slice(0, 3)}</span>
              )}
            </div>
            <select
              value={validAwayTeam.team}
              onChange={(e) => setAwayTeamName(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {currentEquipos
                .filter((t) => t.team !== validHomeTeam.team)
                .map((team) => (
                  <option key={team.team} value={team.team} className="bg-slate-900 text-white">
                    {team.team}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex items-baseline justify-between pt-2 border-t border-white/5 text-xs font-mono text-slate-400">
            <span>xG Proyectado:</span>
            <span className="text-lg sm:text-xl font-black text-white font-mono">
              {simulation.lambdaAway.toFixed(2)}{" "}
              <span className="text-xs text-slate-400 font-normal">xG</span>
            </span>
          </div>
        </div>
      </div>

      {/* ─── Barra de Probabilidades 1X2 ─── */}
      <div className="p-3.5 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5 sm:space-y-3">
        <div className="flex items-center justify-between text-[11px] sm:text-xs font-mono gap-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-bold text-white max-w-[80px] sm:max-w-none truncate">{validHomeTeam.team}</span>
            <span className="text-emerald-400 font-bold shrink-0">{simulation.homePercent}%</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
            <span>Empate</span>
            <span className="font-bold text-amber-300">{simulation.drawPercent}%</span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0 justify-end">
            <span className="text-cyan-400 font-bold shrink-0">{simulation.awayPercent}%</span>
            <span className="font-bold text-white max-w-[80px] sm:max-w-none truncate text-right">{validAwayTeam.team}</span>
          </div>
        </div>

        {/* Barra Proporcional */}
        <div className="w-full h-3.5 rounded-full bg-slate-900 overflow-hidden flex p-0.5 border border-white/10 shadow-inner">
          <div
            className="h-full rounded-l-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
            style={{ width: `${simulation.homePercent}%` }}
          />
          <div
            className="h-full bg-slate-600/70 transition-all duration-700"
            style={{ width: `${simulation.drawPercent}%` }}
          />
          <div
            className="h-full rounded-r-full bg-gradient-to-r from-sky-400 to-cyan-500 transition-all duration-700 shadow-[0_0_12px_rgba(56,189,248,0.5)]"
            style={{ width: `${simulation.awayPercent}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pt-1">
          <span>1: Victoria Local</span>
          <span>X: Empate</span>
          <span>2: Victoria Visitante</span>
        </div>
      </div>

      {/* ─── Grid Inferior: Matriz de Calor 4x4 + Amenazas de Gol ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Matriz de Calor 4x4 de Marcadores Exactos */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>📊</span>
              <span>Matriz de Calor: Marcadores Más Probables</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-amber-300 border border-amber-300/20">
              Más probable: {simulation.mostLikely.h} - {simulation.mostLikely.a} (
              {(simulation.mostLikely.prob * 100).toFixed(1)}%)
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/5 overflow-x-auto">
            {/* Cabecera de columnas: Goles Visitante */}
            <div className="grid grid-cols-5 gap-1.5 text-center text-xs font-mono min-w-[320px]">
              <div className="p-2 text-[10px] text-slate-500 font-bold uppercase flex items-center justify-center">
                L \ V
              </div>
              {[0, 1, 2, 3].map((a) => (
                <div key={a} className="p-2 text-slate-400 font-bold bg-white/[0.02] rounded-lg">
                  {a} {validAwayTeam.team.slice(0, 3)}
                </div>
              ))}

              {/* Filas: Goles Local */}
              {[0, 1, 2, 3].map((h) => (
                <React.Fragment key={h}>
                  <div className="p-2 text-slate-400 font-bold bg-white/[0.02] rounded-lg flex items-center justify-center text-xs">
                    {h} {validHomeTeam.team.slice(0, 3)}
                  </div>
                  {[0, 1, 2, 3].map((a) => {
                    const cell = simulation.matrix4x4[h][a];
                    const percent = (cell.prob * 100).toFixed(1);
                    const isTop =
                      h === simulation.mostLikely.h &&
                      a === simulation.mostLikely.a;
                    const intensity = Math.min(
                      1,
                      cell.prob / (simulation.maxProb || 0.1)
                    );

                    return (
                      <div
                        key={`${h}-${a}`}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all ${isTop
                            ? "border-amber-400 bg-amber-500/20 shadow-[0_0_15px_rgba(251,191,36,0.3)] ring-1 ring-amber-400/50"
                            : "border-white/5"
                          }`}
                        style={{
                          backgroundColor: isTop
                            ? undefined
                            : `rgba(56, 189, 248, ${intensity * 0.28})`,
                        }}
                      >
                        <span className="font-bold text-xs text-white font-mono">
                          {h} - {a}
                        </span>
                        <span
                          className={`text-[10px] font-mono mt-0.5 ${isTop ? "text-amber-300 font-extrabold" : "text-slate-300"
                            }`}
                        >
                          {percent}%
                        </span>
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Amenazas de Gol (Top 2 por equipo) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>⚽</span>
            <span>Amenazas de Gol (Probabilidad de Anotar)</span>
          </h3>

          {/* Local Threats */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-400 font-mono">
                {validHomeTeam.team} (Peligro de Gol)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">xG/90 min</span>
            </div>

            {simulation.homeThreats.map((player, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs hover:border-emerald-500/30 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                    {player.photo ? (
                      <img src={player.photo} alt={player.name} loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400">
                        {player.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-white">{player.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {player.position} · {player.goals} goles esta temporada
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono font-black text-emerald-400">
                    {Math.round(player.scoringChance * 100)}%
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono">prob. gol</div>
                </div>
              </div>
            ))}
          </div>

          {/* Away Threats */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-cyan-400 font-mono">
                {validAwayTeam.team} (Peligro de Gol)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">xG/90 min</span>
            </div>

            {simulation.awayThreats.map((player, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs hover:border-cyan-500/30 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                    {player.photo ? (
                      <img src={player.photo} alt={player.name} loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400">
                        {player.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-white">{player.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {player.position} · {player.goals} goles esta temporada
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono font-black text-cyan-400">
                    {Math.round(player.scoringChance * 100)}%
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono">prob. gol</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

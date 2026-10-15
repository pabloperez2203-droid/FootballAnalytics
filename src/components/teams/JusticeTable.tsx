"use client";

import React, { useState, useMemo } from "react";
import { TeamXgData, TeamJusticeStats } from "./types";
import { getTeamCrest, getTeamColor } from "@/utils/crests";

export const REAL_POINTS: Record<string, number> = {
  "Barcelona": 21,
  "Atletico Madrid": 16,
  "Real Betis": 16,
  "Real Madrid": 15,
  "Sevilla": 13,
  "Alaves": 11,
  "Deportivo La Coruna": 10,
  "Real Sociedad": 10,
  "Getafe": 8,
  "Rayo Vallecano": 8,
  "Villarreal": 8,
  "Athletic Club": 8,
  "Osasuna": 8,
  "Racing Santander": 7,
  "Espanyol": 7,
  "Celta Vigo": 7,
  "Levante": 5,
  "Elche": 5,
  "Valencia": 4,
  "Malaga": 3
};

interface JusticeTableProps {
  teams: TeamXgData[];
  onSelectTeam?: (teamName: string) => void;
  selectedTeamA?: string;
  selectedTeamB?: string;
}

export default function JusticeTable({
  teams,
  onSelectTeam,
  selectedTeamA,
  selectedTeamB
}: JusticeTableProps) {
  const [tableMode, setTableMode] = useState<"real" | "justice">("justice");
  const [searchQuery, setSearchQuery] = useState("");

  // Process all teams with rankings and metrics
  const processedTeams: TeamJusticeStats[] = useMemo(() => {
    // 1. Calculate base stats
    const list = teams.map(t => {
      const realPts = typeof t.pts === "number" ? t.pts : (REAL_POINTS[t.team] ?? 0);
      const diffPts = realPts - t.expected_points;

      let status: "over" | "balanced" | "under" = "balanced";
      let statusLabel = "En su media";

      if (diffPts >= 3.0) {
        status = "over";
        statusLabel = "Sobrerendimiento";
      } else if (diffPts <= -3.0) {
        status = "under";
        statusLabel = "Castigado por el azar";
      }

      return {
        ...t,
        realPts,
        diffPts,
        realRank: 0,
        xptsRank: 0,
        status,
        statusLabel
      };
    });

    // 2. Compute Real Ranking
    const sortedByReal = [...list].sort((a, b) => {
      if (b.realPts !== a.realPts) return b.realPts - a.realPts;
      const gdA = a.goals_for - a.goals_against;
      const gdB = b.goals_for - b.goals_against;
      if (gdB !== gdA) return gdB - gdA;
      return b.goals_for - a.goals_for;
    });
    sortedByReal.forEach((t, i) => {
      t.realRank = i + 1;
    });

    // 3. Compute xPTS Justice Ranking
    const sortedByJustice = [...list].sort((a, b) => {
      if (b.expected_points !== a.expected_points) return b.expected_points - a.expected_points;
      const xgdA = a.xg_for - a.xg_against;
      const xgdB = b.xg_for - b.xg_against;
      return xgdB - xgdA;
    });
    sortedByJustice.forEach((t, i) => {
      t.xptsRank = i + 1;
    });

    return list;
  }, [teams]);

  // Display list ordered by current mode
  const displayedTeams = useMemo(() => {
    let sorted = [...processedTeams];
    if (tableMode === "real") {
      sorted.sort((a, b) => a.realRank - b.realRank);
    } else {
      sorted.sort((a, b) => a.xptsRank - b.xptsRank);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      sorted = sorted.filter(t => t.team.toLowerCase().includes(q));
    }

    return sorted;
  }, [processedTeams, tableMode, searchQuery]);

  // Dynamic summary leaders
  const topOverperformer = useMemo(() => {
    if (!processedTeams.length) return null;
    return [...processedTeams].sort((a, b) => b.diffPts - a.diffPts)[0];
  }, [processedTeams]);

  const topUnderperformer = useMemo(() => {
    if (!processedTeams.length) return null;
    return [...processedTeams].sort((a, b) => a.diffPts - b.diffPts)[0];
  }, [processedTeams]);

  const leaderJustice = useMemo(() => {
    if (!processedTeams.length) return null;
    return [...processedTeams].sort((a, b) => b.expected_points - a.expected_points)[0];
  }, [processedTeams]);

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6 border border-white/10 shadow-2xl relative">
      {/* Header with Switch */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
              Meritocracia Estadística
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            La Tabla de la Justicia
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Clasificación Real vs Clasificación según Puntos Esperados (xPTS) basados en la calidad de ocasiones
          </p>
        </div>

        {/* Interactive Mode Toggle */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-white/10 self-stretch sm:self-auto">
          <button
            onClick={() => setTableMode("real")}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              tableMode === "real"
                ? "bg-slate-800 text-white shadow-md border border-white/15"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Clasificación Real (PTS)
          </button>
          <button
            onClick={() => setTableMode("justice")}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
              tableMode === "justice"
                ? "bg-emerald-500/20 text-emerald-300 shadow-md border border-emerald-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Clasificación Justicia (xPTS)
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
        <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
              Mayor Sobrerendimiento
            </div>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">
              {topOverperformer ? `${topOverperformer.team} (+${topOverperformer.diffPts.toFixed(2)} pts)` : "—"}
            </div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
            {topOverperformer ? `+${topOverperformer.diffPts.toFixed(2)}` : "+0.00"}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
              Mayor Castigo del Azar
            </div>
            <div className="text-sm font-bold text-rose-400 mt-0.5">
              {topUnderperformer ? `${topUnderperformer.team} (${topUnderperformer.diffPts.toFixed(2)} pts)` : "—"}
            </div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono font-bold">
            {topUnderperformer ? topUnderperformer.diffPts.toFixed(2) : "-0.00"}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/40 border border-white/5 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
              Líder Justo de LaLiga
            </div>
            <div className="text-sm font-bold text-white mt-0.5">
              {leaderJustice ? `${leaderJustice.team} (${leaderJustice.expected_points.toFixed(2)} xPTS)` : "—"}
            </div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono font-bold">
            P1
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-white/10 mt-2">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-white/10 bg-slate-950/80 text-[11px] font-mono uppercase tracking-wider text-slate-400">
              <th className="py-3 px-3 w-12 text-center">Pos</th>
              <th className="py-3 px-2 w-14 text-center">Δ Pos</th>
              <th className="py-3 px-3">Equipo</th>
              <th className="py-3 px-3 text-center">PJ</th>
              <th className="py-3 px-3 text-center">
                <span className={tableMode === "real" ? "text-blue-400 font-bold" : ""}>
                  PTS
                </span>
              </th>
              <th className="py-3 px-3 text-center">
                <span className={tableMode === "justice" ? "text-emerald-400 font-bold" : ""}>
                  xPTS
                </span>
              </th>
              <th className="py-3 px-3 text-center">Diferencial (PTS - xPTS)</th>
              <th className="py-3 px-3 text-right">Veredicto Táctico</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs font-sans">
            {displayedTeams.map((team, idx) => {
              const currentPos = idx + 1;
              // Movement: if in justice mode, how much higher is xpts rank than real rank?
              // e.g. Real rank 11, xpts rank 3 -> moved up +8 spots!
              const posDelta = team.realRank - team.xptsRank;
              const isSelected = team.team === selectedTeamA || team.team === selectedTeamB;
              const color = getTeamColor(team.team);

              return (
                <tr
                  key={team.team}
                  onClick={() => onSelectTeam && onSelectTeam(team.team)}
                  className={`hover:bg-white/[0.04] transition-colors cursor-pointer ${
                    isSelected ? "bg-white/[0.07]" : ""
                  }`}
                >
                  {/* Position */}
                  <td className="py-3 px-3 text-center font-mono font-bold text-slate-300">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs ${
                        currentPos <= 4
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : currentPos <= 6
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          : currentPos >= 18
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : "text-slate-400"
                      }`}
                    >
                      {currentPos}
                    </span>
                  </td>

                  {/* Pos Delta Movement */}
                  <td className="py-3 px-2 text-center font-mono text-[11px]">
                    {posDelta > 0 ? (
                      <span className="text-emerald-400 font-semibold" title={`Sube ${posDelta} puestos en justicia`}>
                        ▲ +{posDelta}
                      </span>
                    ) : posDelta < 0 ? (
                      <span className="text-rose-400 font-semibold" title={`Baja ${Math.abs(posDelta)} puestos en justicia`}>
                        ▼ {posDelta}
                      </span>
                    ) : (
                      <span className="text-slate-600">=</span>
                    )}
                  </td>

                  {/* Team Crest & Name */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg bg-slate-900 border flex items-center justify-center p-1 shrink-0"
                        style={{ borderColor: `${color}40` }}
                      >
                        {getTeamCrest(team.team) ? (
                          <img
                            src={getTeamCrest(team.team)}
                            alt={team.team}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-[10px] font-bold text-white font-mono">
                            {team.team.substring(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="font-semibold text-white hover:text-emerald-400 transition-colors">
                          {team.team}
                        </span>
                        {isSelected && (
                          <span className="ml-2 text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-slate-300">
                            Activo
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Matches Played */}
                  <td className="py-3 px-3 text-center font-mono text-slate-400">
                    {team.matches_played}
                  </td>

                  {/* Real Points */}
                  <td className="py-3 px-3 text-center font-mono text-sm font-semibold text-slate-200">
                    {team.realPts}
                  </td>

                  {/* Expected Points */}
                  <td className="py-3 px-3 text-center font-mono text-sm font-bold text-slate-100">
                    {team.expected_points.toFixed(2)}
                  </td>

                  {/* Differential Badge */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center">
                      <span
                        className={`inline-flex items-center gap-1 font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                          team.diffPts > 0.5
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : team.diffPts < -0.5
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            : "bg-slate-800 text-slate-300 border border-slate-700"
                        }`}
                      >
                        {team.diffPts >= 0 ? `+${team.diffPts.toFixed(2)}` : team.diffPts.toFixed(2)}
                      </span>
                    </div>
                  </td>

                  {/* Status / Verdict */}
                  <td className="py-3 px-3 text-right">
                    <span
                      className={`inline-block text-[10px] font-mono font-medium px-2 py-0.5 rounded-md ${
                        team.status === "over"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : team.status === "under"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          : "bg-slate-800/80 text-slate-400 border border-white/5"
                      }`}
                    >
                      {team.statusLabel}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 px-1">
        <span>💡 Haz clic en cualquier club para seleccionarlo en el comparador táctico</span>
        <div className="flex items-center gap-4 mt-1 sm:mt-0">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> Zona Champions (1-4)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-400" /> Descenso (18-20)
          </span>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useMemo } from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import { TeamXgData } from "./types";
import { getTeamCrest, getTeamColor } from "@/utils/crests";

interface TeamComparatorProps {
  teams: TeamXgData[];
  teamAName: string;
  teamBName: string;
  onSelectTeamA: (name: string) => void;
  onSelectTeamB: (name: string) => void;
}

interface RadarDataPoint {
  axis: string;
  shortLabel: string;
  teamAVal: number;
  teamBVal: number;
  teamARaw: string;
  teamBRaw: string;
  unit: string;
  rawNumA: number;
  rawNumB: number;
  higherIsBetter: boolean;
}

export default function TeamComparator({
  teams,
  teamAName,
  teamBName,
  onSelectTeamA,
  onSelectTeamB
}: TeamComparatorProps) {
  const teamA = useMemo(() => teams.find(t => t.team === teamAName) || teams[0], [teams, teamAName]);
  const teamB = useMemo(() => teams.find(t => t.team === teamBName) || teams[1] || teams[0], [teams, teamBName]);

  const colorA = useMemo(() => getTeamColor(teamA.team), [teamA]);
  const colorB = useMemo(() => getTeamColor(teamB.team), [teamB]);

  // Compute percentile relative to all 20 teams (0 to 100)
  const calculatePercentile = (field: keyof TeamXgData, val: number, higherIsBetter: boolean): number => {
    const allVals = teams.map(t => Number(t[field]) || 0);
    const countWorse = allVals.filter(v => (higherIsBetter ? v < val : v > val)).length;
    const countEqual = allVals.filter(v => v === val).length;
    if (allVals.length <= 1) return 50;
    const pct = Math.round(((countWorse + 0.5 * (countEqual - 1)) / (allVals.length - 1)) * 100);
    return Math.max(0, Math.min(100, pct));
  };

  // 6 Specified Axes
  const radarData: RadarDataPoint[] = useMemo(() => {
    const axesDef = [
      {
        axis: "Ataque (xG)",
        shortLabel: "Ataque",
        field: "xg_for" as keyof TeamXgData,
        higherIsBetter: true,
        unit: "xG",
        format: (v: number) => v.toFixed(2)
      },
      {
        axis: "Pegada (G - xG)",
        shortLabel: "Pegada",
        field: "diff_goals_xg" as keyof TeamXgData,
        higherIsBetter: true,
        unit: "diff",
        format: (v: number) => (v >= 0 ? `+${v.toFixed(2)}` : v.toFixed(2))
      },
      {
        axis: "Solidez Defensiva",
        shortLabel: "Solidez",
        field: "xg_against" as keyof TeamXgData,
        higherIsBetter: false, // Menor xGA = mejor solidez
        unit: "xGA",
        format: (v: number) => `${v.toFixed(2)} xGA`
      },
      {
        axis: "Intensidad Presión",
        shortLabel: "Presión",
        field: "ppda_avg" as keyof TeamXgData,
        higherIsBetter: false, // Menor PPDA = más pases cortados = mayor presión
        unit: "PPDA",
        format: (v: number) => `${v.toFixed(2)} PPDA`
      },
      {
        axis: "Profundidad (deep)",
        shortLabel: "Profundidad",
        field: "deep_completions" as keyof TeamXgData,
        higherIsBetter: true,
        unit: "deep",
        format: (v: number) => `${v} pases`
      },
      {
        axis: "Rendimiento Esperado",
        shortLabel: "xPTS",
        field: "expected_points" as keyof TeamXgData,
        higherIsBetter: true,
        unit: "xPTS",
        format: (v: number) => `${v.toFixed(2)} pts`
      }
    ];

    return axesDef.map(def => {
      const rawA = Number(teamA[def.field]) || 0;
      const rawB = Number(teamB[def.field]) || 0;
      const pctA = calculatePercentile(def.field, rawA, def.higherIsBetter);
      const pctB = calculatePercentile(def.field, rawB, def.higherIsBetter);

      return {
        axis: def.axis,
        shortLabel: def.shortLabel,
        teamAVal: pctA,
        teamBVal: pctB,
        teamARaw: def.format(rawA),
        teamBRaw: def.format(rawB),
        unit: def.unit,
        rawNumA: rawA,
        rawNumB: rawB,
        higherIsBetter: def.higherIsBetter
      };
    });
  }, [teamA, teamB, teams]);

  const teamListSorted = useMemo(() => {
    return [...teams].sort((a, b) => a.team.localeCompare(b.team));
  }, [teams]);

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6 border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Background radial glow */}
      <div
        className="absolute -top-32 -left-32 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-25"
        style={{ backgroundColor: colorA }}
      />
      <div
        className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-25"
        style={{ backgroundColor: colorB }}
      />

      {/* Header & Team Selectors */}
      <div className="relative z-10 mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                Percentil Pizza / Radar
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
              Comparador Cara a Cara
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Percentiles calculados de 0 a 100 respecto a los 20 clubes de LaLiga
            </p>
          </div>

          {/* Quick Swap or Match Indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs text-slate-300 font-mono">
            <span>Duelo Táctico</span>
            <span className="text-slate-500">•</span>
            <span className="text-white font-bold">{teamA.team}</span>
            <span className="text-slate-400">vs</span>
            <span className="text-white font-bold">{teamB.team}</span>
          </div>
        </div>

        {/* Dynamic Selectors Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          {/* Team A Selector Card */}
          <div
            className="p-3.5 sm:p-4 rounded-xl border transition-all duration-300 bg-slate-900/60 backdrop-blur-md flex items-center justify-between gap-3 shadow-lg"
            style={{
              borderColor: `${colorA}50`,
              boxShadow: `0 4px 20px -2px ${colorA}20`
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center p-1.5 shrink-0 bg-slate-950/80 border"
                style={{ borderColor: `${colorA}40` }}
              >
                {getTeamCrest(teamA.team) ? (
                  <img
                    src={getTeamCrest(teamA.team)}
                    alt={teamA.team}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="font-bold text-sm text-white font-mono">
                    {teamA.team.substring(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-400">
                  Equipo A
                </div>
                <div className="text-base sm:text-lg font-bold text-white truncate">
                  {teamA.team}
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  {teamA.matches_played} PJ · {teamA.goals_for} GF · {teamA.goals_against} GC
                </div>
              </div>
            </div>

            <select
              value={teamA.team}
              onChange={e => onSelectTeamA(e.target.value)}
              aria-label="Seleccionar Equipo A"
              className="bg-slate-950 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-medium outline-none cursor-pointer hover:border-white/30 transition-colors shrink-0 max-w-[130px] sm:max-w-[160px]"
            >
              {teamListSorted.map(t => (
                <option key={`teamA-${t.team}`} value={t.team}>
                  {t.team}
                </option>
              ))}
            </select>
          </div>

          {/* Team B Selector Card */}
          <div
            className="p-3.5 sm:p-4 rounded-xl border transition-all duration-300 bg-slate-900/60 backdrop-blur-md flex items-center justify-between gap-3 shadow-lg"
            style={{
              borderColor: `${colorB}50`,
              boxShadow: `0 4px 20px -2px ${colorB}20`
            }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center p-1.5 shrink-0 bg-slate-950/80 border"
                style={{ borderColor: `${colorB}40` }}
              >
                {getTeamCrest(teamB.team) ? (
                  <img
                    src={getTeamCrest(teamB.team)}
                    alt={teamB.team}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="font-bold text-sm text-white font-mono">
                    {teamB.team.substring(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-mono tracking-wider font-semibold text-slate-400">
                  Equipo B
                </div>
                <div className="text-base sm:text-lg font-bold text-white truncate">
                  {teamB.team}
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  {teamB.matches_played} PJ · {teamB.goals_for} GF · {teamB.goals_against} GC
                </div>
              </div>
            </div>

            <select
              value={teamB.team}
              onChange={e => onSelectTeamB(e.target.value)}
              aria-label="Seleccionar Equipo B"
              className="bg-slate-950 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-medium outline-none cursor-pointer hover:border-white/30 transition-colors shrink-0 max-w-[130px] sm:max-w-[160px]"
            >
              {teamListSorted.map(t => (
                <option key={`teamB-${t.team}`} value={t.team}>
                  {t.team}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Radar Chart + Head-to-Head Metric Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
        {/* Radar Chart Visual (7 Cols on desktop) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center">
          <div className="w-full h-[320px] sm:h-[380px] max-w-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="75%">
                <PolarGrid stroke="rgba(255,255,255,0.12)" />
                <PolarAngleAxis
                  dataKey="shortLabel"
                  tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fill: "#64748b", fontSize: 9 }}
                  stroke="rgba(255,255,255,0.06)"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload as RadarDataPoint;
                    return (
                      <div className="bg-slate-950/95 border border-white/15 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs font-sans min-w-[200px]">
                        <div className="font-bold text-slate-200 border-b border-white/10 pb-1.5 mb-2">
                          {item.axis}
                        </div>
                        <div className="flex items-center justify-between gap-4 mb-1">
                          <span className="flex items-center gap-1.5 font-medium text-white">
                            <span
                              className="w-2.5 h-2.5 rounded-full inline-block"
                              style={{ backgroundColor: colorA }}
                            />
                            {teamA.team}:
                          </span>
                          <span className="font-mono text-slate-200">
                            <strong>P{item.teamAVal}</strong> ({item.teamARaw})
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 font-medium text-white">
                            <span
                              className="w-2.5 h-2.5 rounded-full inline-block"
                              style={{ backgroundColor: colorB }}
                            />
                            {teamB.team}:
                          </span>
                          <span className="font-mono text-slate-200">
                            <strong>P{item.teamBVal}</strong> ({item.teamBRaw})
                          </span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Radar
                  name={teamA.team}
                  dataKey="teamAVal"
                  stroke={colorA}
                  fill={colorA}
                  fillOpacity={0.35}
                  strokeWidth={2.5}
                />
                <Radar
                  name={teamB.team}
                  dataKey="teamBVal"
                  stroke={colorB}
                  fill={colorB}
                  fillOpacity={0.35}
                  strokeWidth={2.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend below Radar */}
          <div className="flex items-center justify-center gap-6 mt-1 text-xs">
            <div className="flex items-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded-md shadow-sm border border-white/20"
                style={{ backgroundColor: colorA }}
              />
              <span className="font-bold text-white">{teamA.team}</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded-md shadow-sm border border-white/20"
                style={{ backgroundColor: colorB }}
              />
              <span className="font-bold text-white">{teamB.team}</span>
            </div>
          </div>
        </div>

        {/* Head-to-Head Comparative Metric Cards (5 Cols on desktop) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Métricas Cara a Cara</span>
            <span>Percentil (0-100)</span>
          </div>

          {radarData.map(item => {
            const diffPct = item.teamAVal - item.teamBVal;
            const aWins = diffPct > 0;
            const bWins = diffPct < 0;

            return (
              <div
                key={item.axis}
                className="p-3 rounded-xl bg-slate-900/70 border border-white/10 hover:border-white/20 transition-all duration-200"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-slate-200">{item.axis}</span>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span
                      className={`font-bold ${aWins ? "text-emerald-400" : "text-slate-400"}`}
                    >
                      P{item.teamAVal}
                    </span>
                    <span className="text-slate-600">vs</span>
                    <span
                      className={`font-bold ${bWins ? "text-emerald-400" : "text-slate-400"}`}
                    >
                      P{item.teamBVal}
                    </span>
                  </div>
                </div>

                {/* Comparative Double Bar */}
                <div className="grid grid-cols-2 gap-1.5 h-2 bg-slate-950/80 rounded-full overflow-hidden p-0.5 border border-white/5">
                  {/* Team A bar (grows right to left or left to right) */}
                  <div className="h-full bg-slate-800 rounded-full overflow-hidden flex justify-end">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.teamAVal}%`,
                        backgroundColor: colorA
                      }}
                    />
                  </div>
                  {/* Team B bar */}
                  <div className="h-full bg-slate-800 rounded-full overflow-hidden flex justify-start">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.teamBVal}%`,
                        backgroundColor: colorB
                      }}
                    />
                  </div>
                </div>

                {/* Raw values underneath */}
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1">
                  <span>{item.teamARaw}</span>
                  <span>{item.teamBRaw}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

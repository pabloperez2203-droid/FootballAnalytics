"use client";

import React, { useMemo, useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { TeamXgData } from "./types";
import { getTeamCrest, getTeamColor } from "@/utils/crests";

interface TacticalStyleMatrixProps {
  teams: TeamXgData[];
  onSelectTeam?: (teamName: string) => void;
  selectedTeamA?: string;
  selectedTeamB?: string;
}

interface ScatterPoint {
  team: string;
  ppda: number;
  deep: number;
  xg: number;
  goals: number;
  xpts: number;
  quadrantName: string;
}

export default function TacticalStyleMatrix({
  teams,
  onSelectTeam,
  selectedTeamA,
  selectedTeamB
}: TacticalStyleMatrixProps) {
  const [hoveredTeam, setHoveredTeam] = useState<string | null>(null);

  // League averages for reference lines
  const avgPpda = useMemo(() => {
    const total = teams.reduce((acc, t) => acc + (t.ppda_avg || 0), 0);
    return teams.length ? Number((total / teams.length).toFixed(2)) : 10.5;
  }, [teams]);

  const avgDeep = useMemo(() => {
    const total = teams.reduce((acc, t) => acc + (t.deep_completions || 0), 0);
    return teams.length ? Math.round(total / teams.length) : 45;
  }, [teams]);

  // Determine tactical quadrant label
  const getQuadrant = (ppda: number, deep: number) => {
    const isHighPress = ppda <= avgPpda; // Menor PPDA = más presión
    const isHighDeep = deep >= avgDeep; // Más deep = mayor profundidad
    if (isHighPress && isHighDeep) return "Asedio Total & Presión Alta";
    if (!isHighPress && isHighDeep) return "Verticalidad / Posesión Profunda";
    if (isHighPress && !isHighDeep) return "Presión Asfixiante Directa";
    return "Bloque Bajo & Contragolpe";
  };

  const scatterData: ScatterPoint[] = useMemo(() => {
    return teams.map(t => ({
      team: t.team,
      ppda: t.ppda_avg,
      deep: t.deep_completions,
      xg: t.xg_for,
      goals: t.goals_for,
      xpts: t.expected_points,
      quadrantName: getQuadrant(t.ppda_avg, t.deep_completions)
    }));
  }, [teams, avgPpda, avgDeep]);

  // Min and max bounds for axes
  const minPpda = Math.floor(Math.min(...teams.map(t => t.ppda_avg)) - 1);
  const maxPpda = Math.ceil(Math.max(...teams.map(t => t.ppda_avg)) + 1);
  const minDeep = Math.floor(Math.min(...teams.map(t => t.deep_completions)) * 0.8);
  const maxDeep = Math.ceil(Math.max(...teams.map(t => t.deep_completions)) * 1.08);

  const activeTeamData = useMemo(() => {
    const name = hoveredTeam || selectedTeamA || teams[0]?.team;
    return scatterData.find(s => s.team === name);
  }, [hoveredTeam, selectedTeamA, scatterData, teams]);

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6 border border-white/10 shadow-2xl relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
              Matriz Cuadrantes de Estilo
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            Presión vs Profundidad
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Eje X: PPDA (menor = presión más intensa) · Eje Y: Deep completions (pases al área rival)
          </p>
        </div>

        {/* Legend pills */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
          <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            Q1: Asedio y Presión Alta
          </span>
          <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            Q2: Posesión Profunda
          </span>
          <span className="px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20">
            Q4: Bloque Bajo
          </span>
        </div>
      </div>

      {/* Scatter Chart */}
      <div className="w-full h-[360px] sm:h-[420px] mt-4 relative">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 25, bottom: 25, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            
            <XAxis
              type="number"
              dataKey="ppda"
              name="PPDA"
              domain={[minPpda, maxPpda]}
              tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "monospace" }}
              tickLine={{ stroke: "#475569" }}
              axisLine={{ stroke: "#334155" }}
              label={{
                value: "← Más Presión (PPDA Bajo)  ·  Bloque Pasivo (PPDA Alto) →",
                position: "insideBottom",
                offset: -16,
                fill: "#64748b",
                fontSize: 10,
                fontFamily: "monospace"
              }}
            />
            
            <YAxis
              type="number"
              dataKey="deep"
              name="Deep Completions"
              domain={[minDeep, maxDeep]}
              tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "monospace" }}
              tickLine={{ stroke: "#475569" }}
              axisLine={{ stroke: "#334155" }}
              label={{
                value: "Profundidad (Pases al área)",
                angle: -90,
                position: "insideLeft",
                offset: 5,
                fill: "#64748b",
                fontSize: 10,
                fontFamily: "monospace"
              }}
            />

            {/* Average Reference Lines */}
            <ReferenceLine
              x={avgPpda}
              stroke="#64748b"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Media PPDA (${avgPpda})`,
                fill: "#94a3b8",
                fontSize: 9,
                position: "insideTopLeft",
                fontFamily: "monospace"
              }}
            />
            <ReferenceLine
              y={avgDeep}
              stroke="#64748b"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Media Deep (${avgDeep})`,
                fill: "#94a3b8",
                fontSize: 9,
                position: "insideBottomRight",
                fontFamily: "monospace"
              }}
            />

            <Tooltip
              cursor={{ strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.2)" }}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const p = payload[0].payload as ScatterPoint;
                const crest = getTeamCrest(p.team);
                const color = getTeamColor(p.team);

                return (
                  <div className="bg-slate-950/95 border border-white/20 rounded-xl p-3.5 shadow-2xl backdrop-blur-md text-xs font-sans min-w-[210px]">
                    <div className="flex items-center gap-2.5 pb-2 mb-2 border-b border-white/10">
                      <div
                        className="w-7 h-7 rounded-lg bg-slate-900 border p-1 flex items-center justify-center shrink-0"
                        style={{ borderColor: `${color}60` }}
                      >
                        {crest ? (
                          <img src={crest} alt={p.team} className="w-full h-full object-contain" />
                        ) : (
                          <span className="font-bold font-mono text-[9px]">{p.team.substring(0, 2)}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">{p.team}</div>
                        <div className="text-[10px] font-mono text-cyan-400">{p.quadrantName}</div>
                      </div>
                    </div>

                    <div className="space-y-1 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Intensidad PPDA:</span>
                        <strong className="text-slate-200">{p.ppda.toFixed(2)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Profundidad (Deep):</span>
                        <strong className="text-slate-200">{p.deep} pases</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Volumen xG:</span>
                        <strong className="text-slate-200">{p.xg.toFixed(2)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Puntos Esperados:</span>
                        <strong className="text-emerald-400">{p.xpts.toFixed(2)} xPTS</strong>
                      </div>
                    </div>
                  </div>
                );
              }}
            />

            {/* Scatter dots with Team Crests */}
            <Scatter
              name="Equipos"
              data={scatterData}
              shape={(props: any) => {
                const { cx, cy, payload } = props;
                if (!cx || !cy) return <g />;
                const crest = getTeamCrest(payload.team);
                const color = getTeamColor(payload.team);
                const isHovered = hoveredTeam === payload.team;
                const isSelected = selectedTeamA === payload.team || selectedTeamB === payload.team;

                return (
                  <g
                    className="cursor-pointer transition-transform duration-200"
                    onMouseEnter={() => setHoveredTeam(payload.team)}
                    onMouseLeave={() => setHoveredTeam(null)}
                    onClick={() => onSelectTeam && onSelectTeam(payload.team)}
                  >
                    {/* Outer glow ring if selected */}
                    {isSelected && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={19}
                        fill="none"
                        stroke={color}
                        strokeWidth={2.5}
                        strokeDasharray="3 3"
                        className="animate-spin"
                        style={{ transformOrigin: `${cx}px ${cy}px` }}
                      />
                    )}

                    {/* Background badge circle */}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 17 : 14}
                      fill="#0b0f17"
                      stroke={isSelected ? "#ffffff" : color}
                      strokeWidth={isSelected ? 2 : 1.5}
                      opacity={0.95}
                    />

                    {/* Crest Image */}
                    {crest ? (
                      <image
                        href={crest}
                        x={cx - (isHovered ? 13 : 11)}
                        y={cy - (isHovered ? 13 : 11)}
                        width={isHovered ? 26 : 22}
                        height={isHovered ? 26 : 22}
                        preserveAspectRatio="xMidYMid meet"
                      />
                    ) : (
                      <text
                        x={cx}
                        y={cy + 4}
                        textAnchor="middle"
                        fill="#fff"
                        fontSize={9}
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {payload.team.substring(0, 2).toUpperCase()}
                      </text>
                    )}
                  </g>
                );
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Selected/Hovered Team Highlight Bar */}
      {activeTeamData && (
        <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getTeamColor(activeTeamData.team) }}
            />
            <span className="font-bold text-white text-sm">{activeTeamData.team}</span>
            <span className="text-slate-500">•</span>
            <span className="text-cyan-400 font-mono text-[11px]">{activeTeamData.quadrantName}</span>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px] text-slate-300">
            <span>
              PPDA: <strong className="text-white">{activeTeamData.ppda.toFixed(2)}</strong>
            </span>
            <span>
              Deep: <strong className="text-white">{activeTeamData.deep}</strong>
            </span>
            <span>
              xG: <strong className="text-white">{activeTeamData.xg.toFixed(2)}</strong>
            </span>
            <button
              onClick={() => onSelectTeam && onSelectTeam(activeTeamData.team)}
              className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-sans text-xs transition-colors"
            >
              Comparar en Radar →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

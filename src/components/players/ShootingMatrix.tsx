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
import { PlayerComputedMetrics } from "./types";
import { getTeamCrest, getTeamColor } from "@/utils/crests";

interface ShootingMatrixProps {
  players: PlayerComputedMetrics[];
  onSelectPlayer?: (playerName: string) => void;
  selectedPlayerName?: string;
}

interface ScatterItem {
  id: string | number;
  name: string;
  team: string;
  position: string;
  shotsPer90: number;
  npxgPerShot: number;
  goals: number;
  xg: number;
  delta: number; // goals - xg
  minutes: number;
  quadrant: string;
}

export default function ShootingMatrix({
  players,
  onSelectPlayer,
  selectedPlayerName
}: ShootingMatrixProps) {
  const [hoveredPlayer, setHoveredPlayer] = useState<string | null>(null);

  // Averages for quadrant dividers
  const { avgShots90, avgNpxgPerShot } = useMemo(() => {
    if (!players.length) return { avgShots90: 2.0, avgNpxgPerShot: 0.12 };
    const validPlayers = players.filter(p => p.shots > 0);
    if (!validPlayers.length) return { avgShots90: 2.0, avgNpxgPerShot: 0.12 };

    const totalShots90 = validPlayers.reduce((acc, p) => acc + p.p90.shots, 0);
    const totalNpxgPerShot = validPlayers.reduce((acc, p) => acc + p.npxgPerShot, 0);

    return {
      avgShots90: Number((totalShots90 / validPlayers.length).toFixed(2)),
      avgNpxgPerShot: Number((totalNpxgPerShot / validPlayers.length).toFixed(3))
    };
  }, [players]);

  const scatterData: ScatterItem[] = useMemo(() => {
    return players
      .filter(p => p.shots > 0)
      .map(p => {
        const isHighVolume = p.p90.shots >= avgShots90;
        const isHighQuality = p.npxgPerShot >= avgNpxgPerShot;

        let quadrant = "Rematador Secundario";
        if (isHighVolume && isHighQuality) quadrant = "Élite Ofensiva (Volumen + Calidad)";
        else if (!isHighVolume && isHighQuality) quadrant = "Francotirador Selectivo";
        else if (isHighVolume && !isHighQuality) quadrant = "Metralleta (Tirador Compulsivo)";

        return {
          id: p.player_id,
          name: p.player_name,
          team: p.team_name,
          position: p.position,
          shotsPer90: Number(p.p90.shots.toFixed(2)),
          npxgPerShot: Number(p.npxgPerShot.toFixed(3)),
          goals: p.goals,
          xg: Number(p.xg.toFixed(2)),
          delta: Number(p.finishingDelta.toFixed(2)),
          minutes: p.minutes,
          quadrant
        };
      });
  }, [players, avgShots90, avgNpxgPerShot]);

  const activeItem = useMemo(() => {
    const name = hoveredPlayer || selectedPlayerName;
    return scatterData.find(s => s.name === name);
  }, [hoveredPlayer, selectedPlayerName, scatterData]);

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6 border border-white/10 shadow-2xl relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
              Matriz de Disparo & Eficiencia
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            Francotiradores vs Metralletas
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Eje X: Tiros por 90' (Volumen) · Eje Y: npxG por Tiro (Calidad de remate) · Color: Delta G - xG
          </p>
        </div>

        {/* Color Legend */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
            <span className="text-slate-300">Letal (G &gt; xG)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm" />
            <span className="text-slate-300">Fallón (G &lt; xG)</span>
          </div>
        </div>
      </div>

      {/* Scatter Chart */}
      <div className="w-full h-[360px] sm:h-[420px] mt-4 relative">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 25, bottom: 25, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />

            <XAxis
              type="number"
              dataKey="shotsPer90"
              name="Tiros por 90'"
              tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "monospace" }}
              tickLine={{ stroke: "#475569" }}
              axisLine={{ stroke: "#334155" }}
              label={{
                value: "Tiros por 90 minutos (Volumen de Disparo) →",
                position: "insideBottom",
                offset: -16,
                fill: "#64748b",
                fontSize: 10,
                fontFamily: "monospace"
              }}
            />

            <YAxis
              type="number"
              dataKey="npxgPerShot"
              name="npxG por Tiro"
              tick={{ fill: "#94a3b8", fontSize: 11, fontFamily: "monospace" }}
              tickLine={{ stroke: "#475569" }}
              axisLine={{ stroke: "#334155" }}
              label={{
                value: "npxG por Tiro (Probabilidad Media) →",
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
              x={avgShots90}
              stroke="#64748b"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Media Tiros (${avgShots90})`,
                fill: "#94a3b8",
                fontSize: 9,
                position: "insideTopLeft",
                fontFamily: "monospace"
              }}
            />
            <ReferenceLine
              y={avgNpxgPerShot}
              stroke="#64748b"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Media npxG/Tiro (${avgNpxgPerShot})`,
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
                const p = payload[0].payload as ScatterItem;
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
                        <div className="font-bold text-white text-sm">{p.name}</div>
                        <div className="text-[10px] font-mono text-slate-400">{p.team} · {p.position}</div>
                      </div>
                    </div>

                    <div className="space-y-1 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Perfil:</span>
                        <strong className="text-cyan-400">{p.quadrant}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tiros / 90':</span>
                        <strong className="text-slate-200">{p.shotsPer90}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">npxG por Tiro:</span>
                        <strong className="text-slate-200">{p.npxgPerShot}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Goles vs xG:</span>
                        <span className={`font-bold ${p.delta >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {p.goals}G vs {p.xg}xG ({p.delta >= 0 ? `+${p.delta}` : p.delta})
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />

            {/* Scatter dots */}
            <Scatter
              name="Jugadores"
              data={scatterData}
              shape={(props: any) => {
                const { cx, cy, payload } = props;
                if (!cx || !cy) return <g />;
                const isSelected = selectedPlayerName === payload.name;
                const isHovered = hoveredPlayer === payload.name;
                const isPositive = payload.delta >= 0;
                const dotColor = isPositive ? "#10b981" : "#f43f5e";

                return (
                  <g
                    className="cursor-pointer transition-transform duration-200"
                    onMouseEnter={() => setHoveredPlayer(payload.name)}
                    onMouseLeave={() => setHoveredPlayer(null)}
                    onClick={() => onSelectPlayer && onSelectPlayer(payload.name)}
                  >
                    {/* Ring if selected */}
                    {isSelected && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={13}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth={2}
                        strokeDasharray="2 2"
                      />
                    )}
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isHovered ? 8 : isSelected ? 6.5 : 4.5}
                      fill={dotColor}
                      stroke="#0f172a"
                      strokeWidth={1.5}
                      opacity={isHovered ? 1 : isSelected ? 1 : 0.75}
                    />
                  </g>
                );
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Active Dot Detail Banner */}
      {activeItem && (
        <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-3 h-3 rounded-full ${
                activeItem.delta >= 0 ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
            <span className="font-bold text-white text-sm">{activeItem.name}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 font-mono text-[11px]">{activeItem.team}</span>
            <span className="text-slate-500">•</span>
            <span className="text-cyan-400 font-mono text-[11px]">{activeItem.quadrant}</span>
          </div>

          <div className="flex items-center gap-4 font-mono text-[11px] text-slate-300">
            <span>
              Tiros/90: <strong className="text-white">{activeItem.shotsPer90}</strong>
            </span>
            <span>
              npxG/Tiro: <strong className="text-white">{activeItem.npxgPerShot}</strong>
            </span>
            <span>
              Goles: <strong className="text-white">{activeItem.goals}</strong> ({activeItem.delta >= 0 ? `+${activeItem.delta}` : activeItem.delta})
            </span>
            <button
              onClick={() => onSelectPlayer && onSelectPlayer(activeItem.name)}
              className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-sans text-xs transition-colors"
            >
              Usar como molde de clones →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

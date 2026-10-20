"use client";

import React, { useState, useMemo } from "react";
import { PlayerComputedMetrics, CloneMatch } from "./types";
import { getTeamCrest, getTeamColor } from "@/utils/crests";
import { useCompetition } from "@/stores/filterStore";

function ClonePlayerAvatar({
  player,
  crest,
  color,
  size = "md"
}: {
  player: PlayerComputedMetrics;
  crest?: string;
  color: string;
  size?: "sm" | "md" | "lg";
}) {
  const localPhoto = useMemo(() => {
    if (!player.photo) return "";
    if (player.photo.startsWith("/player-photos/")) return player.photo;
    const match = player.photo.match(/images\.fotmob\.com\/image_resources\/playerimages\/(\d+\.png)/);
    return match ? `/player-photos/${match[1]}` : player.photo;
  }, [player.photo]);

  const [imgSrc, setImgSrc] = useState(localPhoto);
  const [imgError, setImgError] = useState(false);

  React.useEffect(() => {
    setImgSrc(localPhoto);
    setImgError(false);
  }, [localPhoto, player.player_name]);

  const handleError = () => {
    if (imgSrc !== player.photo && player.photo) {
      setImgSrc(player.photo);
    } else {
      setImgError(true);
    }
  };

  const initials = player.player_name
    .split(" ")
    .filter(Boolean)
    .map(n => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const sizeClasses = size === "lg" ? "w-14 h-14 rounded-2xl" : "w-11 h-11 rounded-xl";

  return (
    <div className="relative shrink-0">
      <div
        className={`${sizeClasses} bg-slate-950 border overflow-hidden flex items-center justify-center font-bold font-mono text-xs shadow-lg`}
        style={{ borderColor: `${color}70` }}
      >
        {imgSrc && !imgError ? (
          <img
            src={imgSrc}
            alt={player.player_name}
            onError={handleError}
            referrerPolicy="no-referrer"
            loading="lazy"
            className="w-full h-full object-cover object-top scale-110"
          />
        ) : crest ? (
          <img src={crest} alt={player.team_name} className="w-full h-full object-contain p-2" />
        ) : (
          <span style={{ color }}>{initials}</span>
        )}
      </div>
      {crest && imgSrc && !imgError && (
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-950 border border-white/20 p-0.5 shadow">
          <img src={crest} alt={player.team_name} className="w-full h-full object-contain" />
        </div>
      )}
    </div>
  );
}

interface StatisticalClonesProps {
  allEligiblePlayers: PlayerComputedMetrics[];
  referencePlayerName: string;
  onSelectReferencePlayer: (name: string) => void;
}

export default function StatisticalClones({
  allEligiblePlayers,
  referencePlayerName,
  onSelectReferencePlayer
}: StatisticalClonesProps) {
  const { competition } = useCompetition();

  // Reference player object
  const referencePlayer = useMemo(() => {
    return (
      allEligiblePlayers.find(p => p.player_name === referencePlayerName) ||
      allEligiblePlayers.find(p => p.player_name.includes("Raphinha")) ||
      allEligiblePlayers.find(p => p.player_name.includes("Mbappe")) ||
      allEligiblePlayers[0]
    );
  }, [allEligiblePlayers, referencePlayerName]);

  // Compute z-score stats for the 6 metrics across the pool
  const metricKeys = [
    { key: "npxg" as const, label: "npxG/90", get: (p: PlayerComputedMetrics) => p.p90.npxg },
    { key: "xa" as const, label: "xA/90", get: (p: PlayerComputedMetrics) => p.p90.xa },
    { key: "xgChain" as const, label: "xGChain/90", get: (p: PlayerComputedMetrics) => p.p90.xgChain },
    { key: "xgBuildup" as const, label: "xGBuildup/90", get: (p: PlayerComputedMetrics) => p.p90.xgBuildup },
    { key: "shots" as const, label: "Tiros/90", get: (p: PlayerComputedMetrics) => p.p90.shots },
    { key: "keyPasses" as const, label: "Pases Clave/90", get: (p: PlayerComputedMetrics) => p.p90.keyPasses }
  ];

  const zStats = useMemo(() => {
    const stats: Record<string, { mean: number; std: number }> = {};
    if (!allEligiblePlayers.length) return stats;

    metricKeys.forEach(m => {
      const vals = allEligiblePlayers.map(m.get);
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vals.length;
      const std = variance > 0 ? Math.sqrt(variance) : 1;
      stats[m.key] = { mean, std };
    });

    return stats;
  }, [allEligiblePlayers]);

  // Compute top 3 statistical clones
  const topClones: CloneMatch[] = useMemo(() => {
    if (!referencePlayer || !allEligiblePlayers.length || Object.keys(zStats).length === 0) return [];

    // Reference z-vector
    const refZ = metricKeys.map(m => {
      const { mean, std } = zStats[m.key] || { mean: 0, std: 1 };
      const val = m.get(referencePlayer);
      return std > 0 ? (val - mean) / std : 0;
    });

    const candidates: CloneMatch[] = [];

    allEligiblePlayers.forEach(candidate => {
      if (candidate.player_name === referencePlayer.player_name) return;

      const candZ = metricKeys.map(m => {
        const { mean, std } = zStats[m.key] || { mean: 0, std: 1 };
        const val = m.get(candidate);
        return std > 0 ? (val - mean) / std : 0;
      });

      // Normalized Euclidean distance across the 6 dimensions
      const sqDiffs = refZ.map((rz, i) => Math.pow(rz - candZ[i], 2));
      const dist = Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / metricKeys.length);

      // Similarity percentage using exponential decay
      const similarityPct = Math.max(10, Math.min(99, Math.round(Math.exp(-0.35 * dist) * 100)));

      // Strengths / profile tag
      const strengths: string[] = [];
      if (candidate.p90.npxg > 0.4) strengths.push("Goleador");
      if (candidate.p90.xa > 0.25) strengths.push("Generador de Asistencias");
      if (candidate.p90.xgChain > 0.8) strengths.push("Canalizador Ofensivo");
      if (candidate.p90.shots > 3.0) strengths.push("Alto Volumen de Remate");
      if (!strengths.length) strengths.push("Equilibrio Táctico");

      candidates.push({
        player: candidate,
        similarityPct,
        distance: Number(dist.toFixed(2)),
        keyStrengths: strengths.slice(0, 2)
      });
    });

    candidates.sort((a, b) => b.similarityPct - a.similarityPct);
    return candidates.slice(0, 3);
  }, [referencePlayer, allEligiblePlayers, zStats]);

  // Suggested popular players for fast switching
  const popularPresets = [
    "Raphinha",
    "Kylian Mbappe-Lottin",
    "Lamine Yamal",
    "Vinícius Júnior",
    "Ayoze Pérez",
    "Antoine Griezmann",
    "Robert Lewandowski"
  ];

  const refColor = referencePlayer ? getTeamColor(referencePlayer.team_name) : "#3b82f6";
  const refCrest = referencePlayer ? getTeamCrest(referencePlayer.team_name) : "";

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6 border border-white/10 shadow-2xl relative overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[110px] pointer-events-none opacity-20"
        style={{ backgroundColor: refColor }}
      />

      {/* Header & Reference Player Selector */}
      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
              Algoritmo de Similitud Vectorial
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            Buscador de Clones Estadísticos
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Compara la distancia euclídea multidimensional en 6 métricas clave por 90' para hallar perfiles análogos
          </p>
        </div>

        {/* Reference Player Dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
          <span className="text-xs font-mono text-slate-400">Jugador Referencia:</span>
          <select
            value={referencePlayer?.player_name || ""}
            onChange={e => onSelectReferencePlayer(e.target.value)}
            aria-label="Seleccionar jugador de referencia"
            className="bg-slate-950/90 border border-white/20 rounded-xl px-3.5 py-2 text-xs font-semibold text-white outline-none focus:border-cyan-400/60 cursor-pointer shadow-lg"
          >
            {allEligiblePlayers.map(p => (
              <option key={p.player_name} value={p.player_name}>
                {p.player_name} ({p.team_name})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Preset Fast Selection Chips */}
      <div className="relative z-10 my-4 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-500 font-mono text-[11px] mr-1">Sugeridos:</span>
        {popularPresets.map(name => {
          const matched = allEligiblePlayers.find(p => p.player_name.includes(name));
          if (!matched) return null;
          const isSelected = referencePlayer?.player_name === matched.player_name;
          return (
            <button
              type="button"
              key={name}
              onClick={() => onSelectReferencePlayer(matched.player_name)}
              className={`px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-medium transition-all cursor-pointer touch-manipulation active:scale-95 ${
                isSelected
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 shadow-sm font-bold"
                  : "bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08] border border-white/5"
              }`}
            >
              {matched.player_name.split(" ").slice(-2).join(" ")}
            </button>
          );
        })}
      </div>

      {/* Main Comparison Section: Reference Card (Left) vs 3 Clone Cards (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 relative z-10 mt-2">
        {/* Reference Player Overview (4 cols) */}
        {referencePlayer && (
          <div
            className="lg:col-span-4 p-5 rounded-2xl bg-slate-900/80 border transition-all shadow-xl flex flex-col justify-between"
            style={{ borderColor: `${refColor}60` }}
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white font-bold">
                  Molde de Referencia
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {referencePlayer.minutes} mins jugados
                </span>
              </div>

              {/* Player Header */}
              <div className="flex items-center gap-3 mb-5">
                <ClonePlayerAvatar
                  key={`${referencePlayer.player_id}-${referencePlayer.photo}`}
                  player={referencePlayer}
                  crest={refCrest}
                  color={refColor}
                  size="lg"
                />
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {referencePlayer.player_name}
                  </h3>
                  <div className="text-xs text-slate-400 font-mono">
                    {referencePlayer.team_name} · <span className="text-slate-200">{referencePlayer.position}</span>
                  </div>
                  <div className="text-xs font-mono text-emerald-400 mt-0.5">
                    {referencePlayer.goals} Goles · {referencePlayer.assists} Asistencias
                  </div>
                </div>
              </div>

              {/* Baseline Metrics Grid */}
              <div className="space-y-2 border-t border-white/10 pt-4 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>npxG por 90':</span>
                  <strong className="text-white">{referencePlayer.p90.npxg.toFixed(2)}</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>xA por 90':</span>
                  <strong className="text-white">{referencePlayer.p90.xa.toFixed(2)}</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>xGChain por 90':</span>
                  <strong className="text-white">{referencePlayer.p90.xgChain.toFixed(2)}</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>xGBuildup por 90':</span>
                  <strong className="text-white">{referencePlayer.p90.xgBuildup.toFixed(2)}</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Tiros por 90':</span>
                  <strong className="text-white">{referencePlayer.p90.shots.toFixed(2)}</strong>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Pases Clave por 90':</span>
                  <strong className="text-white">{referencePlayer.p90.keyPasses.toFixed(2)}</strong>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 text-[11px] font-mono text-slate-400 text-center">
              Target vector normalizado con Z-Score
            </div>
          </div>
        )}

        {/* 3 Most Similar Clones (8 cols) */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-3.5">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Los 3 Clones más cercanos en {competition === 'ucl' ? 'la Champions League' : 'LaLiga'}</span>
            <span className="text-cyan-400 font-semibold">% de Similitud Vectorial</span>
          </div>

          {topClones.map((clone, idx) => {
            const p = clone.player;
            const crest = getTeamCrest(p.team_name);
            const color = getTeamColor(p.team_name);

            return (
              <div
                key={p.player_name}
                onClick={() => onSelectReferencePlayer(p.player_name)}
                className="p-4 rounded-xl bg-slate-900/60 border border-white/10 hover:border-cyan-400/50 transition-all duration-300 shadow-md group cursor-pointer relative"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Player Basic Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-mono font-bold text-xs text-slate-300 shrink-0">
                      #{idx + 1}
                    </span>
                    <ClonePlayerAvatar
                      key={`${p.player_id}-${p.photo}`}
                      player={p}
                      crest={crest}
                      color={color}
                      size="md"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm sm:text-base truncate group-hover:text-cyan-300 transition-colors">
                          {p.player_name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-slate-300 shrink-0">
                          {p.position}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {p.team_name} · {p.minutes} mins · {p.goals}G / {p.assists}A
                      </div>
                    </div>
                  </div>

                  {/* Similarity Badge & Strengths */}
                  <div className="flex items-center gap-3 sm:justify-end shrink-0">
                    <div className="flex flex-wrap gap-1 sm:justify-end">
                      {clone.keyStrengths.map(tag => (
                        <span
                          key={tag}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-300 border border-white/10"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="text-right min-w-[75px]">
                      <div className="text-xl sm:text-2xl font-mono font-extrabold text-cyan-400 tabular-nums">
                        {clone.similarityPct}%
                      </div>
                      <div className="text-[9px] font-mono text-slate-500">
                        dist: {clone.distance}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compared Metrics Mini-Bar Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3 pt-3 border-t border-white/5 text-[10px] font-mono text-slate-400">
                  <div className="bg-slate-950/60 p-1.5 rounded-lg text-center">
                    <span className="block text-slate-500 text-[9px]">npxG/90</span>
                    <span className="font-bold text-white">{p.p90.npxg.toFixed(2)}</span>
                  </div>
                  <div className="bg-slate-950/60 p-1.5 rounded-lg text-center">
                    <span className="block text-slate-500 text-[9px]">xA/90</span>
                    <span className="font-bold text-white">{p.p90.xa.toFixed(2)}</span>
                  </div>
                  <div className="bg-slate-950/60 p-1.5 rounded-lg text-center">
                    <span className="block text-slate-500 text-[9px]">xGC/90</span>
                    <span className="font-bold text-white">{p.p90.xgChain.toFixed(2)}</span>
                  </div>
                  <div className="bg-slate-950/60 p-1.5 rounded-lg text-center">
                    <span className="block text-slate-500 text-[9px]">xGB/90</span>
                    <span className="font-bold text-white">{p.p90.xgBuildup.toFixed(2)}</span>
                  </div>
                  <div className="bg-slate-950/60 p-1.5 rounded-lg text-center">
                    <span className="block text-slate-500 text-[9px]">Tiros/90</span>
                    <span className="font-bold text-white">{p.p90.shots.toFixed(2)}</span>
                  </div>
                  <div className="bg-slate-950/60 p-1.5 rounded-lg text-center">
                    <span className="block text-slate-500 text-[9px]">P.Clave/90</span>
                    <span className="font-bold text-white">{p.p90.keyPasses.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

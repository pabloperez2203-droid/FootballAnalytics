"use client";

import React, { useState, useMemo } from "react";
import { PlayerComputedMetrics } from "./types";
import { getTeamCrest, getTeamColor } from "@/utils/crests";

function LeaderPlayerAvatar({ player, crest, color }: { player: PlayerComputedMetrics; crest?: string; color: string }) {
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

  return (
    <div className="relative shrink-0">
      <div
        className="w-12 h-12 rounded-xl bg-slate-900 border overflow-hidden flex items-center justify-center font-bold font-mono text-xs shadow-md"
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
          <img src={crest} alt={player.team_name} className="w-8 h-8 object-contain" />
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

interface LeaderKpisProps {
  players: PlayerComputedMetrics[];
  onSelectPlayer?: (playerName: string) => void;
}

export default function LeaderKpis({ players, onSelectPlayer }: LeaderKpisProps) {
  // 1. Leader in Threat / 90 (npxG + xA / 90)
  const threatLeader = useMemo(() => {
    if (!players.length) return null;
    return [...players].sort((a, b) => b.p90.threat - a.p90.threat)[0];
  }, [players]);

  // 2. Leader in Finishing (Goals - xG)
  const finisherLeader = useMemo(() => {
    if (!players.length) return null;
    return [...players].sort((a, b) => b.finishingDelta - a.finishingDelta)[0];
  }, [players]);

  // 3. Leader in Game Engine (xGChain / 90)
  const engineLeader = useMemo(() => {
    if (!players.length) return null;
    return [...players].sort((a, b) => b.p90.xgChain - a.p90.xgChain)[0];
  }, [players]);

  const cards = [
    {
      title: "Mayor Amenaza por 90'",
      subtitle: "npxG + xA por cada 90 minutos jugados",
      player: threatLeader,
      metricValue: threatLeader ? threatLeader.p90.threat.toFixed(2) : "0.00",
      metricUnit: "/90",
      badge: "Amenaza Ofensiva",
      badgeColor: "#10b981",
      secondaryText: threatLeader
        ? `${threatLeader.np_xg.toFixed(2)} npxG · ${threatLeader.xa.toFixed(2)} xA`
        : ""
    },
    {
      title: "Mejor Finalizador",
      subtitle: "Mayor diferencial positivo de Goles vs xG",
      player: finisherLeader,
      metricValue: finisherLeader
        ? finisherLeader.finishingDelta >= 0
          ? `+${finisherLeader.finishingDelta.toFixed(2)}`
          : finisherLeader.finishingDelta.toFixed(2)
        : "+0.00",
      metricUnit: "G - xG",
      badge: "Eficacia Letal",
      badgeColor: "#06b6d4",
      secondaryText: finisherLeader
        ? `${finisherLeader.goals} goles con solo ${finisherLeader.xg.toFixed(2)} xG`
        : ""
    },
    {
      title: "Motor de Juego",
      subtitle: "Mayor volumen de xGChain por 90 minutos",
      player: engineLeader,
      metricValue: engineLeader ? engineLeader.p90.xgChain.toFixed(2) : "0.00",
      metricUnit: "xGC/90",
      badge: "Distribución & Peligro",
      badgeColor: "#8b5cf6",
      secondaryText: engineLeader
        ? `${engineLeader.minutes} mins · ${engineLeader.key_passes} pases clave`
        : ""
    }
  ];

  if (!players.length) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center text-slate-400 text-sm">
        No hay jugadores que cumplan los filtros actuales para calcular los líderes.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card, idx) => {
        const p = card.player;
        if (!p) return null;
        const color = getTeamColor(p.team_name);
        const crest = getTeamCrest(p.team_name);

        return (
          <div
            key={idx}
            onClick={() => onSelectPlayer && onSelectPlayer(p.player_name)}
            className="glass-card interactive-card rounded-2xl p-4 sm:p-5 border border-white/10 hover:border-white/20 transition-all duration-300 relative overflow-hidden group cursor-pointer shadow-xl"
          >
            {/* Ambient dynamic glow */}
            <div
              className="absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none transition-opacity group-hover:opacity-40"
              style={{ backgroundColor: card.badgeColor }}
            />

            {/* Top Badge & Metric Title */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <span
                className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${card.badgeColor}20`,
                  color: card.badgeColor,
                  border: `1px solid ${card.badgeColor}40`
                }}
              >
                {card.badge}
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                P1 del Filtro
              </span>
            </div>

            <div className="text-sm font-semibold text-slate-300">
              {card.title}
            </div>
            <div className="text-[11px] text-slate-400 mb-4 line-clamp-1">
              {card.subtitle}
            </div>

            {/* Player Info & Giant Metric Value */}
            <div className="flex items-end justify-between gap-3 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2.5 min-w-0">
                <LeaderPlayerAvatar key={`${p.player_id}-${p.photo}`} player={p} crest={crest} color={color} />
                <div className="min-w-0">
                  <div className="text-sm sm:text-base font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                    {p.player_name}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 truncate">
                    {p.team_name} · <span className="text-slate-300 font-semibold">{p.position}</span>
                  </div>
                </div>
              </div>

              {/* Metric display */}
              <div className="text-right shrink-0">
                <div
                  className="text-2xl font-mono font-extrabold tracking-tight tabular-nums"
                  style={{ color: card.badgeColor }}
                >
                  {card.metricValue}
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  {card.metricUnit}
                </div>
              </div>
            </div>

            {/* Context Subtitle */}
            <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>{card.secondaryText}</span>
              <span className="text-emerald-400/80 group-hover:text-emerald-300 transition-colors">
                Ver clon →
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

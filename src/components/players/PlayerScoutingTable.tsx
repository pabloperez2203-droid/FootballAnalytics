"use client";

import React, { useState, useMemo } from "react";
import { PlayerComputedMetrics } from "./types";
import { getTeamCrest, getTeamColor } from "@/utils/crests";

interface PlayerScoutingTableProps {
  players: PlayerComputedMetrics[];
  onSelectPlayer?: (playerName: string) => void;
  selectedPlayerName?: string;
}

type MetricPerspective = "standard" | "creation" | "press";

type SortColumn =
  | "player_name"
  | "team_name"
  | "minutes"
  // Standard
  | "goals"
  | "xg"
  | "finishingDelta"
  | "assists"
  | "xa"
  | "xgChain90"
  // Creation & Progression
  | "npxg90"
  | "xa90"
  | "progPasses"
  | "progCarries"
  | "sca"
  | "gca"
  // Pressure & Recovery
  | "pressures"
  | "pressures90"
  | "recoveries"
  | "recoveries90"
  | "xgBuildup90";

function PlayerTableAvatar({
  player,
  color,
  crest
}: {
  player: PlayerComputedMetrics;
  color: string;
  crest?: string;
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

  return (
    <div
      className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center font-bold font-mono text-[9px] bg-slate-900 border shrink-0 shadow-sm"
      style={{ borderColor: `${color}80` }}
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
        <img
          src={crest}
          alt={player.team_name}
          className="w-5 h-5 object-contain"
        />
      ) : (
        <span style={{ color }}>{initials}</span>
      )}
    </div>
  );
}

export default function PlayerScoutingTable({
  players,
  onSelectPlayer,
  selectedPlayerName
}: PlayerScoutingTableProps) {
  const [perspective, setPerspective] = useState<MetricPerspective>("standard");
  const [sortCol, setSortCol] = useState<SortColumn>("finishingDelta");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 25; // Máximo 25 filas visibles a la vez para rendimiento óptimo

  // Handle header sort click
  const handleSort = (col: SortColumn) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      setSortAsc(col === "player_name" || col === "team_name");
    }
    setCurrentPage(1);
  };

  // Handle perspective change
  const handlePerspectiveChange = (tab: MetricPerspective) => {
    setPerspective(tab);
    if (tab === "creation") {
      setSortCol("sca");
      setSortAsc(false);
    } else if (tab === "press") {
      setSortCol("pressures90");
      setSortAsc(false);
    } else {
      setSortCol("finishingDelta");
      setSortAsc(false);
    }
    setCurrentPage(1);
  };

  // Sorted list
  const sortedPlayers = useMemo(() => {
    const list = [...players];
    list.sort((a, b) => {
      let valA: string | number = 0;
      let valB: string | number = 0;

      switch (sortCol) {
        case "player_name":
          valA = a.player_name;
          valB = b.player_name;
          break;
        case "team_name":
          valA = a.team_name;
          valB = b.team_name;
          break;
        case "minutes":
          valA = a.minutes;
          valB = b.minutes;
          break;
        // Standard
        case "goals":
          valA = a.goals;
          valB = b.goals;
          break;
        case "xg":
          valA = a.xg;
          valB = b.xg;
          break;
        case "finishingDelta":
          valA = a.finishingDelta;
          valB = b.finishingDelta;
          break;
        case "assists":
          valA = a.assists;
          valB = b.assists;
          break;
        case "xa":
          valA = a.xa;
          valB = b.xa;
          break;
        case "xgChain90":
          valA = a.p90.xgChain;
          valB = b.p90.xgChain;
          break;
        // Creation
        case "npxg90":
          valA = a.p90.npxg;
          valB = b.p90.npxg;
          break;
        case "xa90":
          valA = a.p90.xa;
          valB = b.p90.xa;
          break;
        case "progPasses":
          valA = a.progressive_passes ?? 0;
          valB = b.progressive_passes ?? 0;
          break;
        case "progCarries":
          valA = a.progressive_carries ?? 0;
          valB = b.progressive_carries ?? 0;
          break;
        case "sca":
          valA = a.sca ?? 0;
          valB = b.sca ?? 0;
          break;
        case "gca":
          valA = a.gca ?? 0;
          valB = b.gca ?? 0;
          break;
        // Pressure
        case "pressures":
          valA = a.successful_pressures ?? 0;
          valB = b.successful_pressures ?? 0;
          break;
        case "pressures90":
          valA = a.p90.pressures ?? a.successful_pressures_per_90 ?? 0;
          valB = b.p90.pressures ?? b.successful_pressures_per_90 ?? 0;
          break;
        case "recoveries":
          valA = a.final_third_recoveries ?? 0;
          valB = b.final_third_recoveries ?? 0;
          break;
        case "recoveries90":
          valA = a.p90.finalThirdRecoveries ?? a.final_third_recoveries_per_90 ?? 0;
          valB = b.p90.finalThirdRecoveries ?? b.final_third_recoveries_per_90 ?? 0;
          break;
        case "xgBuildup90":
          valA = a.p90.xgBuildup;
          valB = b.p90.xgBuildup;
          break;
      }

      if (typeof valA === "string" && typeof valB === "string") {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
    return list;
  }, [players, sortCol, sortAsc]);

  // Paginated window (max 25 rows)
  const totalPages = Math.ceil(sortedPlayers.length / pageSize) || 1;
  const paginatedPlayers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedPlayers.slice(start, start + pageSize);
  }, [sortedPlayers, currentPage]);

  const renderSortIndicator = (col: SortColumn) => {
    if (sortCol !== col) return <span className="opacity-20 ml-1">↕</span>;
    return <span className="text-emerald-400 ml-1">{sortAsc ? "▲" : "▼"}</span>;
  };

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6 border border-white/10 shadow-2xl relative">
      {/* Table Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-xs font-mono uppercase tracking-wider text-blue-400 font-semibold">
              Base de Datos Exhaustiva
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
            Tabla de Scouting & Rendimiento
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Haz clic en cualquier columna para ordenar · Máximo 25 filas por página
          </p>
        </div>

        {/* Metric Perspectives Toggle */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-white/10 text-xs font-mono">
          <button
            type="button"
            onClick={() => handlePerspectiveChange("standard")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-semibold ${
              perspective === "standard"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            🎯 Goles & xG
          </button>
          <button
            type="button"
            onClick={() => handlePerspectiveChange("creation")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-semibold ${
              perspective === "creation"
                ? "bg-emerald-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            ⚡ Creación & Progresión
          </button>
          <button
            type="button"
            onClick={() => handlePerspectiveChange("press")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer font-semibold ${
              perspective === "press"
                ? "bg-purple-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            🛡️ Presión & Robo
          </button>
        </div>

        {/* Results summary tag */}
        <div className="text-xs font-mono text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-white/10 shrink-0">
          Pág <strong className="text-white">{currentPage}</strong> / {totalPages} ({sortedPlayers.length})
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-white/10 mt-4">
        <table className="w-full text-left border-collapse min-w-[780px]">
          <thead>
            <tr className="border-b border-white/10 bg-slate-950/80 text-[11px] font-mono uppercase tracking-wider text-slate-400 select-none">
              <th
                onClick={() => handleSort("player_name")}
                className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
              >
                Jugador {renderSortIndicator("player_name")}
              </th>
              <th
                onClick={() => handleSort("team_name")}
                className="py-3 px-3 cursor-pointer hover:text-white transition-colors"
              >
                Equipo {renderSortIndicator("team_name")}
              </th>
              <th
                onClick={() => handleSort("minutes")}
                className="py-3 px-3 text-center cursor-pointer hover:text-white transition-colors"
              >
                Min {renderSortIndicator("minutes")}
              </th>

              {/* Dynamic Headers based on perspective */}
              {perspective === "standard" && (
                <>
                  <th
                    onClick={() => handleSort("goals")}
                    className="py-3 px-3 text-center cursor-pointer hover:text-white transition-colors"
                  >
                    Goles {renderSortIndicator("goals")}
                  </th>
                  <th
                    onClick={() => handleSort("xg")}
                    className="py-3 px-3 text-center cursor-pointer hover:text-white transition-colors"
                  >
                    xG {renderSortIndicator("xg")}
                  </th>
                  <th
                    onClick={() => handleSort("finishingDelta")}
                    className="py-3 px-3 text-center cursor-pointer hover:text-white transition-colors"
                  >
                    Delta (G-xG) {renderSortIndicator("finishingDelta")}
                  </th>
                  <th
                    onClick={() => handleSort("assists")}
                    className="py-3 px-3 text-center cursor-pointer hover:text-white transition-colors"
                  >
                    Asist {renderSortIndicator("assists")}
                  </th>
                  <th
                    onClick={() => handleSort("xa")}
                    className="py-3 px-3 text-center cursor-pointer hover:text-white transition-colors"
                  >
                    xA {renderSortIndicator("xa")}
                  </th>
                  <th
                    onClick={() => handleSort("xgChain90")}
                    className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors"
                  >
                    xGChain/90 {renderSortIndicator("xgChain90")}
                  </th>
                </>
              )}

              {perspective === "creation" && (
                <>
                  <th
                    onClick={() => handleSort("npxg90")}
                    className="py-3 px-3 text-center cursor-pointer hover:text-white transition-colors"
                  >
                    npxG/90 {renderSortIndicator("npxg90")}
                  </th>
                  <th
                    onClick={() => handleSort("xa90")}
                    className="py-3 px-3 text-center cursor-pointer hover:text-white transition-colors"
                  >
                    xA/90 {renderSortIndicator("xa90")}
                  </th>
                  <th
                    onClick={() => handleSort("progPasses")}
                    className="py-3 px-3 text-center cursor-pointer hover:text-white transition-colors"
                  >
                    Pases Prog {renderSortIndicator("progPasses")}
                  </th>
                  <th
                    onClick={() => handleSort("progCarries")}
                    className="py-3 px-3 text-center cursor-pointer hover:text-white transition-colors"
                  >
                    Conduc Prog {renderSortIndicator("progCarries")}
                  </th>
                  <th
                    onClick={() => handleSort("sca")}
                    className="py-3 px-3 text-center cursor-pointer hover:text-white transition-colors"
                  >
                    SCA (Tiros Creados) {renderSortIndicator("sca")}
                  </th>
                  <th
                    onClick={() => handleSort("gca")}
                    className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors"
                  >
                    GCA (Goles Creados) {renderSortIndicator("gca")}
                  </th>
                </>
              )}

              {perspective === "press" && (
                <>
                  <th
                    onClick={() => handleSort("pressures")}
                    className="py-3 px-3 text-center cursor-pointer hover:text-white transition-colors"
                  >
                    Presiones Éxito {renderSortIndicator("pressures")}
                  </th>
                  <th
                    onClick={() => handleSort("pressures90")}
                    className="py-3 px-3 text-center cursor-pointer hover:text-white transition-colors"
                  >
                    Presiones/90 {renderSortIndicator("pressures90")}
                  </th>
                  <th
                    onClick={() => handleSort("recoveries")}
                    className="py-3 px-3 text-center cursor-pointer hover:text-white transition-colors"
                  >
                    Recup. 3er Tercio {renderSortIndicator("recoveries")}
                  </th>
                  <th
                    onClick={() => handleSort("recoveries90")}
                    className="py-3 px-3 text-center cursor-pointer hover:text-white transition-colors"
                  >
                    Recup/90 {renderSortIndicator("recoveries90")}
                  </th>
                  <th
                    onClick={() => handleSort("xgBuildup90")}
                    className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors"
                  >
                    xGBuildup/90 {renderSortIndicator("xgBuildup90")}
                  </th>
                </>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5 text-xs font-sans">
            {paginatedPlayers.map(p => {
              const isSelected = selectedPlayerName === p.player_name;
              const crest = getTeamCrest(p.team_name);
              const color = getTeamColor(p.team_name);
              const delta = p.finishingDelta;

              return (
                <tr
                  key={p.player_id}
                  onClick={() => onSelectPlayer && onSelectPlayer(p.player_name)}
                  className={`hover:bg-white/[0.04] transition-colors cursor-pointer ${
                    isSelected ? "bg-white/[0.08]" : ""
                  }`}
                >
                  {/* Player Name */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <PlayerTableAvatar
                        key={`${p.player_id}-${p.photo}`}
                        player={p}
                        color={color}
                        crest={crest}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white hover:text-emerald-400 transition-colors truncate max-w-[130px] sm:max-w-[190px]">
                            {p.player_name}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-slate-300 shrink-0">
                            {p.position}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Team */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded bg-slate-900 border p-0.5 flex items-center justify-center shrink-0"
                        style={{ borderColor: `${color}40` }}
                      >
                        {crest ? (
                          <img src={crest} alt={p.team_name} className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-[8px] font-bold font-mono">{p.team_name.substring(0, 2)}</span>
                        )}
                      </div>
                      <span className="text-slate-300 font-mono text-[11px] truncate max-w-[120px]">
                        {p.team_name}
                      </span>
                    </div>
                  </td>

                  {/* Minutes */}
                  <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                    {p.minutes}
                  </td>

                  {/* Perspective: Standard */}
                  {perspective === "standard" && (
                    <>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-white">
                        {p.goals}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-300">
                        {p.xg.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block font-mono font-semibold px-2 py-0.5 rounded-full text-[11px] ${
                            delta > 0.4
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : delta < -0.4
                              ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                              : "bg-slate-800 text-slate-400 border border-white/5"
                          }`}
                        >
                          {delta >= 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-300">
                        {p.assists}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-300">
                        {p.xa.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-purple-300">
                        {p.p90.xgChain.toFixed(2)}
                      </td>
                    </>
                  )}

                  {/* Perspective: Creation & Progression */}
                  {perspective === "creation" && (
                    <>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-cyan-300">
                        {p.p90.npxg.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-emerald-300">
                        {p.p90.xa.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-white">
                        {p.progressive_passes ?? Math.round((p.p90.progressivePasses ?? 0) * (p.minutes / 90))}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-300">
                        {p.progressive_carries ?? Math.round((p.p90.progressiveCarries ?? 0) * (p.minutes / 90))}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-black text-emerald-400">
                        {p.sca ?? Math.round((p.p90.sca ?? 0) * (p.minutes / 90))}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-cyan-400">
                        {p.gca ?? Math.round((p.p90.gca ?? 0) * (p.minutes / 90))}
                      </td>
                    </>
                  )}

                  {/* Perspective: Pressure & Recovery */}
                  {perspective === "press" && (
                    <>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-white">
                        {p.successful_pressures ?? Math.round((p.p90.pressures ?? 0) * (p.minutes / 90))}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-300">
                        {(p.p90.pressures ?? p.successful_pressures_per_90 ?? 0).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-300">
                        {p.final_third_recoveries ?? Math.round((p.p90.finalThirdRecoveries ?? 0) * (p.minutes / 90))}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-cyan-300">
                        {(p.p90.finalThirdRecoveries ?? p.final_third_recoveries_per_90 ?? 0).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-purple-300">
                        {p.p90.xgBuildup.toFixed(2)}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-3 border-t border-white/10 text-xs font-mono text-slate-400">
        <span>
          Mostrando {(currentPage - 1) * pageSize + 1} -{" "}
          {Math.min(currentPage * pageSize, sortedPlayers.length)} de {sortedPlayers.length} futbolistas
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3.5 py-2 min-h-[40px] rounded-xl bg-slate-900 border border-white/10 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 active:bg-slate-700 transition-all cursor-pointer touch-manipulation active:scale-95 flex items-center justify-center font-semibold"
          >
            ← Anterior
          </button>

          <span className="px-3.5 py-2 min-h-[40px] rounded-xl bg-slate-950 border border-white/10 text-white font-bold flex items-center justify-center">
            {currentPage} / {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3.5 py-2 min-h-[40px] rounded-xl bg-slate-900 border border-white/10 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 active:bg-slate-700 transition-all cursor-pointer touch-manipulation active:scale-95 flex items-center justify-center font-semibold"
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  );
}

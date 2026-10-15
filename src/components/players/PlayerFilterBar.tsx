"use client";

import React from "react";

export type PositionFilter = "ALL" | "F" | "M" | "D";

interface PlayerFilterBarProps {
  position: PositionFilter;
  onChangePosition: (pos: PositionFilter) => void;
  selectedTeam: string;
  onChangeTeam: (team: string) => void;
  teamsList: string[];
  searchQuery: string;
  onChangeSearch: (query: string) => void;
  minMinutes: number;
  onChangeMinMinutes: (minutes: number) => void;
  maxMinutesLimit?: number;
  filteredCount: number;
  totalCount: number;
  onResetFilters: () => void;
}

export default function PlayerFilterBar({
  position,
  onChangePosition,
  selectedTeam,
  onChangeTeam,
  teamsList,
  searchQuery,
  onChangeSearch,
  minMinutes,
  onChangeMinMinutes,
  maxMinutesLimit = 720,
  filteredCount,
  totalCount,
  onResetFilters
}: PlayerFilterBarProps) {
  const positionTabs: { key: PositionFilter; label: string }[] = [
    { key: "ALL", label: "Todos" },
    { key: "F", label: "Delanteros (F)" },
    { key: "M", label: "Medios (M)" },
    { key: "D", label: "Defensas (D)" }
  ];

  const hasActiveFilters =
    position !== "ALL" || selectedTeam !== "ALL" || searchQuery.trim() !== "" || minMinutes !== 450;

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-5 border border-white/10 shadow-xl space-y-4">
      {/* Top row: Position Tabs + Search Bar + Team Filter */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Position Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-white/10">
          {positionTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => onChangePosition(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                position === tab.key
                  ? "bg-slate-800 text-white shadow-md border border-white/15"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search input & Team dropdown */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
          {/* Search box */}
          <div className="relative flex-1 sm:w-64">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={e => onChangeSearch(e.target.value)}
              placeholder="Buscar por jugador..."
              className="w-full bg-slate-950/80 border border-white/15 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500/50 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => onChangeSearch("")}
                aria-label="Limpiar búsqueda"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-mono"
              >
                ×
              </button>
            )}
          </div>

          {/* Team Dropdown */}
          <select
            value={selectedTeam}
            onChange={e => onChangeTeam(e.target.value)}
            aria-label="Filtrar por equipo"
            className="bg-slate-950/80 border border-white/15 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500/50 cursor-pointer min-w-[150px]"
          >
            <option value="ALL">Todos los clubes</option>
            {teamsList.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bottom row: Min Minutes Slider + Results Count & Reset */}
      <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        {/* Minutes Slider */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <span className="text-slate-400 font-mono text-[11px] shrink-0">
            Minutos mínimos:
          </span>
          <input
            type="range"
            min={90}
            max={maxMinutesLimit}
            step={30}
            value={minMinutes}
            onChange={e => onChangeMinMinutes(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
          />
          <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0 min-w-[64px] text-center">
            ≥ {minMinutes}m
          </span>
        </div>

        {/* Counter and Reset */}
        <div className="flex items-center gap-3 justify-between sm:justify-end">
          <span className="text-slate-400 font-mono text-[11px]">
            Mostrando <strong className="text-white">{filteredCount}</strong> de {totalCount} futbolistas
          </span>

          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="text-slate-400 hover:text-rose-400 font-mono text-[11px] transition-colors underline underline-offset-4"
            >
              Reiniciar filtros
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

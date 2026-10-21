"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { getTeamCrest, getTeamColor } from "@/utils/crests";
import { LiveMatchData } from "@/app/api/live-matches/route";

interface LiveMatchCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMatchId?: string;
}

export default function LiveMatchCenterModal({
  isOpen,
  onClose,
  initialMatchId,
}: LiveMatchCenterModalProps) {
  const [matches, setMatches] = useState<LiveMatchData[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [countdown, setCountdown] = useState<number>(60);

  // Fetch live matches from our API endpoint
  const fetchLiveMatches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/live-matches", { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP error");
      const data = await res.json();
      if (data && Array.isArray(data.matches) && data.matches.length > 0) {
        setMatches(data.matches);
        setLastRefreshed(new Date());
        setCountdown(60);

        // Si no hay seleccionado o el seleccionado ya no existe
        if (!selectedId || !data.matches.some((m: LiveMatchData) => m.id === selectedId)) {
          const liveMatch = data.matches.find((m: LiveMatchData) => m.status === "LIVE" || m.status === "HT");
          setSelectedId(initialMatchId || (liveMatch ? liveMatch.id : data.matches[0].id));
        }
      }
    } catch (e) {
      console.error("Error fetching live matches:", e);
    } finally {
      setLoading(false);
    }
  }, [initialMatchId, selectedId]);

  // Initial load when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchLiveMatches();
    }
  }, [isOpen]);

  // Smart polling every 60 seconds when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchLiveMatches();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, fetchLiveMatches]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Current active match
  const activeMatch = useMemo(() => {
    return matches.find((m) => m.id === selectedId) || matches[0] || null;
  }, [matches, selectedId]);

  if (!isOpen) return null;

  const isUcl = activeMatch?.competition === "ucl";
  const homeColor = activeMatch ? getTeamColor(activeMatch.home_team) : "#3b82f6";
  const awayColor = activeMatch ? getTeamColor(activeMatch.away_team) : "#ef4444";
  const homeCrest = activeMatch ? getTeamCrest(activeMatch.home_team) : null;
  const awayCrest = activeMatch ? getTeamCrest(activeMatch.away_team) : null;

  // Calculo de porcentajes relativos para barras comparativas
  const totalShots = Math.max(1, (activeMatch?.home_shots || 0) + (activeMatch?.away_shots || 0));
  const homeShotsPct = Math.round(((activeMatch?.home_shots || 0) / totalShots) * 100);

  const totalShotsTarget = Math.max(1, (activeMatch?.home_shots_on_target || 0) + (activeMatch?.away_shots_on_target || 0));
  const homeTargetPct = Math.round(((activeMatch?.home_shots_on_target || 0) / totalShotsTarget) * 100);

  const totalCorners = Math.max(1, (activeMatch?.home_corners || 0) + (activeMatch?.away_corners || 0));
  const homeCornersPct = Math.round(((activeMatch?.home_corners || 0) / totalCorners) * 100);

  const totalXg = Math.max(0.1, (activeMatch?.home_xg || 0) + (activeMatch?.away_xg || 0));
  const homeXgPct = Math.round(((activeMatch?.home_xg || 0) / totalXg) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 sm:p-6 bg-slate-950/85 backdrop-blur-xl animate-fade-in overflow-y-auto">
      {/* Click outside backdrop */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-4xl rounded-3xl bg-[#090d16] border border-white/10 shadow-[0_25px_70px_rgba(0,0,0,0.8)] overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Luces de ambientación */}
        <div
          className="absolute -top-32 -left-32 w-80 h-80 rounded-full blur-[110px] pointer-events-none opacity-20"
          style={{ backgroundColor: homeColor }}
        />
        <div
          className="absolute -top-32 -right-32 w-80 h-80 rounded-full blur-[110px] pointer-events-none opacity-20"
          style={{ backgroundColor: awayColor }}
        />

        {/* ─── Header del Centro de Directo ─── */}
        <div className="px-5 sm:px-8 py-4 border-b border-white/10 flex items-center justify-between gap-4 bg-white/[0.02] shrink-0 relative z-10">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-3 h-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 shadow-[0_0_10px_#ef4444]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold font-mono tracking-wider text-white uppercase">
                  Live Match Center
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wide border ${
                  isUcl
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/30"
                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                }`}>
                  {isUcl ? "UEFA Champions League" : "LaLiga EA Sports"}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                <span>Telemetría en tiempo real</span>
                <span>•</span>
                <span>Auto-refresco: {countdown}s</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botón de Refresco Manual */}
            <button
              type="button"
              onClick={fetchLiveMatches}
              disabled={loading}
              title="Actualizar datos ahora"
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] active:bg-white/[0.15] border border-white/10 text-xs text-slate-300 flex items-center gap-1.5 transition-all cursor-pointer font-mono touch-manipulation active:scale-95"
            >
              <svg
                className={`w-3.5 h-3.5 ${loading ? "animate-spin text-cyan-400" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline">{loading ? "Actualizando..." : "Actualizar"}</span>
            </button>

            {/* Botón Cerrar */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar Live Center"
              className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer touch-manipulation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ─── Selector Horizontal de Partidos Activos ─── */}
        {matches.length > 1 && (
          <div className="px-5 sm:px-8 py-2.5 bg-slate-950/70 border-b border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold shrink-0">
              Partidos:
            </span>
            {matches.map((m) => {
              const isSelected = m.id === selectedId;
              const isLive = m.status === "LIVE" || m.status === "HT";
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedId(m.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer shrink-0 border ${
                    isSelected
                      ? "bg-white/10 text-white border-white/20 shadow-md font-bold"
                      : "bg-white/[0.02] text-slate-400 border-white/5 hover:text-slate-200"
                  }`}
                >
                  {isLive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  )}
                  <span className="font-semibold">{m.home_team}</span>
                  <span className="text-white font-bold">{m.home_score} - {m.away_score}</span>
                  <span className="font-semibold">{m.away_team}</span>
                  <span className={`text-[10px] px-1 rounded ${isLive ? "bg-rose-500/20 text-rose-300 font-bold" : "text-slate-500"}`}>
                    {m.minute}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* ─── Contenedor con Scroll de Detalles ─── */}
        {activeMatch ? (
          <div className="p-5 sm:p-8 space-y-6 overflow-y-auto relative z-10 flex-1">
            {/* Marcador Principal Broadcast */}
            <div className="rounded-2xl p-5 sm:p-7 bg-slate-950/80 border border-white/10 relative overflow-hidden shadow-2xl">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                {/* Equipo Local */}
                <div className="flex items-center gap-4 flex-1 justify-start w-full sm:w-auto">
                  <div
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/[0.04] p-2 flex items-center justify-center shrink-0 border"
                    style={{ borderColor: `${homeColor}50` }}
                  >
                    {homeCrest ? (
                      <img src={homeCrest} alt={activeMatch.home_team} className="w-full h-full object-contain drop-shadow" />
                    ) : (
                      <span className="font-bold text-lg font-mono text-white">{activeMatch.home_team.slice(0, 3)}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                      {activeMatch.home_team}
                    </h3>
                    <div className="text-xs font-mono text-slate-400 mt-0.5">
                      xG Acumulado: <strong className="text-emerald-400 text-sm">{activeMatch.home_xg.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>

                {/* Marcador Central & Minuto */}
                <div className="flex flex-col items-center justify-center shrink-0">
                  {activeMatch.status === "LIVE" || activeMatch.status === "HT" ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono font-bold tracking-wider mb-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      <span>{activeMatch.status === "HT" ? "DESCANSO" : activeMatch.minute}</span>
                    </div>
                  ) : activeMatch.status === "FT" ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-white/10 text-slate-300 text-xs font-mono font-bold tracking-wider mb-2">
                      <span>FINALIZADO</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-mono font-bold tracking-wider mb-2">
                      <span>{activeMatch.minute || "PROGRAMADO"}</span>
                    </div>
                  )}

                  <div className="font-mono font-black text-4xl sm:text-6xl text-white tracking-tight tabular-nums flex items-center gap-3">
                    <span>{activeMatch.home_score}</span>
                    <span className="text-slate-600 font-light">:</span>
                    <span>{activeMatch.away_score}</span>
                  </div>

                  <div className="text-[11px] font-mono text-slate-400 mt-2">
                    {activeMatch.status === "FT"
                      ? "Partido Concluido"
                      : activeMatch.status === "NS"
                      ? "Próximo Enfrentamiento Oficial"
                      : "En Juego · En Directo"}
                  </div>
                </div>

                {/* Equipo Visitante */}
                <div className="flex items-center gap-4 flex-1 justify-end w-full sm:w-auto text-right">
                  <div>
                    <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                      {activeMatch.away_team}
                    </h3>
                    <div className="text-xs font-mono text-slate-400 mt-0.5">
                      xG Acumulado: <strong className="text-cyan-400 text-sm">{activeMatch.away_xg.toFixed(2)}</strong>
                    </div>
                  </div>
                  <div
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/[0.04] p-2 flex items-center justify-center shrink-0 border"
                    style={{ borderColor: `${awayColor}50` }}
                  >
                    {awayCrest ? (
                      <img src={awayCrest} alt={activeMatch.away_team} className="w-full h-full object-contain drop-shadow" />
                    ) : (
                      <span className="font-bold text-lg font-mono text-white">{activeMatch.away_team.slice(0, 3)}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Barra de Progresión de Peligro xG en Directo */}
              <div className="mt-6 pt-5 border-t border-white/10">
                <div className="flex justify-between items-center text-xs font-mono mb-2">
                  <span className="text-slate-300">
                    {activeMatch.home_team}: <strong className="text-emerald-400 font-bold">{activeMatch.home_xg.toFixed(2)} xG</strong> ({homeXgPct}%)
                  </span>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Balance de Ocasiones
                  </span>
                  <span className="text-slate-300">
                    <strong className="text-cyan-400 font-bold">{activeMatch.away_xg.toFixed(2)} xG</strong> ({100 - homeXgPct}%) :{activeMatch.away_team}
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden flex p-0.5 border border-white/5">
                  <div
                    className="h-full rounded-full transition-all duration-700 bg-emerald-500 shadow-[0_0_10px_#10b981]"
                    style={{ width: `${homeXgPct}%` }}
                  />
                  <div
                    className="h-full rounded-full transition-all duration-700 bg-cyan-500 shadow-[0_0_10px_#06b6d4]"
                    style={{ width: `${100 - homeXgPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Grid 4 Estadísticas Clave en Vivo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* 1. Posesión */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  Posesión del Balón
                </div>
                <div className="flex justify-between items-baseline font-mono font-bold text-base text-white">
                  <span>{activeMatch.home_possession}%</span>
                  <span className="text-slate-500 text-xs font-normal">vs</span>
                  <span>{activeMatch.away_possession}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex">
                  <div className="h-full bg-emerald-400" style={{ width: `${activeMatch.home_possession}%` }} />
                  <div className="h-full bg-cyan-400" style={{ width: `${activeMatch.away_possession}%` }} />
                </div>
              </div>

              {/* 2. Tiros Totales */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  Disparos Totales
                </div>
                <div className="flex justify-between items-baseline font-mono font-bold text-base text-white">
                  <span>{activeMatch.home_shots}</span>
                  <span className="text-slate-500 text-xs font-normal">remates</span>
                  <span>{activeMatch.away_shots}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex">
                  <div className="h-full bg-emerald-400" style={{ width: `${homeShotsPct}%` }} />
                  <div className="h-full bg-cyan-400" style={{ width: `${100 - homeShotsPct}%` }} />
                </div>
              </div>

              {/* 3. Tiros a Puerta */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  Tiros entre los 3 palos
                </div>
                <div className="flex justify-between items-baseline font-mono font-bold text-base text-white">
                  <span className="text-emerald-400 font-black">{activeMatch.home_shots_on_target}</span>
                  <span className="text-slate-500 text-xs font-normal">efectividad</span>
                  <span className="text-cyan-400 font-black">{activeMatch.away_shots_on_target}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex">
                  <div className="h-full bg-emerald-400" style={{ width: `${homeTargetPct}%` }} />
                  <div className="h-full bg-cyan-400" style={{ width: `${100 - homeTargetPct}%` }} />
                </div>
              </div>

              {/* 4. Córners */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                  Saques de Esquina
                </div>
                <div className="flex justify-between items-baseline font-mono font-bold text-base text-white">
                  <span>{activeMatch.home_corners}</span>
                  <span className="text-slate-500 text-xs font-normal">córners</span>
                  <span>{activeMatch.away_corners}</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex">
                  <div className="h-full bg-emerald-400" style={{ width: `${homeCornersPct}%` }} />
                  <div className="h-full bg-cyan-400" style={{ width: `${100 - homeCornersPct}%` }} />
                </div>
              </div>
            </div>

            {/* ─── Timeline de Jugadas Clave / Eventos en Directo ─── */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">⚡</span>
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                    Minuto a Minuto & Eventos Clave
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  Goles · Ocasiones xG &gt; 0.30 · Tarjetas
                </span>
              </div>

              {activeMatch.events && activeMatch.events.length > 0 ? (
                <div className="space-y-2 mt-2">
                  {activeMatch.events.map((ev, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950/60 border border-white/5 flex items-center gap-3 text-xs"
                    >
                      <span className="font-mono font-bold text-amber-400 shrink-0 w-8 text-center bg-amber-400/10 px-1 py-0.5 rounded">
                        {ev.minute}&apos;
                      </span>
                      <span className="text-slate-200 leading-snug flex-1">{ev.text}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400 font-mono">
                  Partido en fase inicial. Sin incidencias de peligro crítico registradas todavía.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 font-mono text-xs">
            Cargando telemetría de partidos en directo...
          </div>
        )}
      </div>
    </div>
  );
}

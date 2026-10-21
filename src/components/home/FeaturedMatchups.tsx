"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FEATURED_MATCHES, FeaturedMatch } from "@/config/featuredMatches";
import { getTeamCrest, getTeamColor } from "@/utils/crests";
import { useCompetition, setCompetition } from "@/stores/filterStore";
import { UclStarball } from "@/components/ui/CompetitionBranding";

interface FeaturedMatchupsProps {
  className?: string;
}

export default function FeaturedMatchups({ className = "" }: FeaturedMatchupsProps) {
  const { competition, isUcl } = useCompetition();
  const [filterMode, setFilterMode] = useState<"active" | "all" | "laliga" | "ucl">("active");

  // Filtrado de partidos inminentes de la jornada que viene (solo los más cercanos)
  const displayedMatches = FEATURED_MATCHES.filter((m) => {
    if (filterMode === "active") return m.competition === competition;
    if (filterMode === "all") return true;
    return m.competition === filterMode;
  });

  const handleSimulateClick = (match: FeaturedMatch) => {
    if (match.competition !== competition) {
      setCompetition(match.competition);
    }
  };

  return (
    <section className={`py-10 md:py-14 border-b border-white/5 relative overflow-hidden ${className}`}>
      {/* Resplandor ambiental de fondo */}
      <div
        className={`absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full blur-[140px] pointer-events-none -z-10 transition-colors duration-700 ${isUcl ? "bg-cyan-500/10" : "bg-emerald-500/10"
          }`}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado de la Sección con indicación clara de Próxima Jornada */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-7">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
              </span>
              <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-amber-400">
                PRÓXIMOS PARTIDOS · FECHAS CERCANAS
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex flex-wrap items-center gap-2.5">
              <span>🔥 Próxima Jornada: Duelos Clave</span>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold">
                Jornada que viene
              </span>
            </h2>

            <p className="mt-1 text-xs sm:text-sm text-slate-400 max-w-2xl">
              Solo los choques inminentes del calendario más próximo ({isUcl ? "Jornada 4 Champions League" : "Jornada 10 LaLiga este fin de semana"}). Simula el resultado con nuestro motor xG antes del pitido inicial.
            </p>
          </div>

          {/* Filtros rápidos por competición */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.03] border border-white/10 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setFilterMode("active")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer touch-manipulation ${filterMode === "active"
                  ? isUcl
                    ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20"
                    : "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
            >
              Competición Activa ({isUcl ? "UCL J4" : "LaLiga J10"})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer touch-manipulation ${filterMode === "all"
                  ? "bg-white/20 text-white font-bold"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
            >
              Próximos ({displayedMatches.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("laliga")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer touch-manipulation hidden sm:inline-block ${filterMode === "laliga"
                  ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
            >
              LaLiga (J10)
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("ucl")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer touch-manipulation hidden sm:inline-block ${filterMode === "ucl"
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
            >
              Champions (J4)
            </button>
          </div>
        </div>

        {/* Carrusel táctil en Móvil / Grid en Desktop */}
        <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-4 pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-5">
          {displayedMatches.map((match) => {
            const homeCrest = getTeamCrest(match.homeTeam);
            const awayCrest = getTeamCrest(match.awayTeam);
            const homeColor = getTeamColor(match.homeTeam);
            const awayColor = getTeamColor(match.awayTeam);
            const isMatchUcl = match.competition === "ucl";

            const simulateUrl = `/xg-engine?tool=oracle&comp=${match.competition}&local=${encodeURIComponent(
              match.homeTeam
            )}&visitante=${encodeURIComponent(match.awayTeam)}#oracle`;

            return (
              <div
                key={match.id}
                className="snap-center shrink-0 w-[295px] sm:w-[320px] md:w-auto glass-card interactive-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300 relative overflow-hidden border border-white/10 hover:border-white/25 shadow-xl"
              >
                {/* Resplandor con colores de los clubes */}
                <div
                  className="absolute -top-12 -left-12 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-35 transition-opacity pointer-events-none"
                  style={{ backgroundColor: homeColor }}
                />
                <div
                  className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-35 transition-opacity pointer-events-none"
                  style={{ backgroundColor: awayColor }}
                />

                {/* Cabecera de la tarjeta: Badge de torneo y Tag del duelo */}
                <div className="relative z-10 flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wide border ${isMatchUcl
                        ? "bg-cyan-500/15 border-cyan-400/35 text-cyan-300 shadow-[0_0_10px_rgba(56,189,248,0.2)]"
                        : "bg-emerald-500/15 border-emerald-500/35 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                      }`}
                  >
                    {isMatchUcl ? (
                      <>
                        <UclStarball className="w-2.5 h-2.5" animate glow={false} />
                        <span>CHAMPIONS · J4</span>
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>LALIGA · J10</span>
                      </>
                    )}
                  </span>

                  <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-400/30 text-amber-300 font-mono text-[9px] font-bold uppercase tracking-wider">
                    {match.tag}
                  </span>
                </div>

                {/* Fecha inminente destacada: Jornada que viene */}
                <div className="relative z-10 mb-3 px-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/5 flex items-center justify-between text-[11px] font-mono">
                  <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                    <span className="text-amber-400 text-xs">📅</span>
                    <span>{match.dateLabel}</span>
                  </div>
                  <span className="text-[10px] text-amber-400/90 font-bold uppercase tracking-wider">
                    {match.relativeTime}
                  </span>
                </div>

                {/* Escudos y Duelo Central */}
                <div className="relative z-10 py-2 my-1 flex items-center justify-between">
                  {/* Local */}
                  <div className="flex flex-col items-center gap-2 flex-1 text-center">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/[0.04] border border-white/10 p-2 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                      {homeCrest ? (
                        <img
                          src={homeCrest}
                          alt={match.homeTeam}
                          className="w-full h-full object-contain drop-shadow"
                          loading="lazy"
                        />
                      ) : (
                        <span className="font-bold text-sm text-white font-mono">
                          {match.homeTeam.slice(0, 3).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="block font-bold text-xs sm:text-sm text-white leading-tight">
                        {match.homeTeam}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">Local</span>
                    </div>
                  </div>

                  {/* VS Central Badge */}
                  <div className="flex flex-col items-center justify-center px-2 shrink-0">
                    <div className="w-8 h-8 rounded-full bg-black/60 border border-white/20 flex items-center justify-center shadow-md shadow-black/50">
                      <span className="font-mono font-black text-[10px] text-amber-400">VS</span>
                    </div>
                    <span className="text-[8px] font-mono text-slate-400 mt-1 uppercase">10k Sims</span>
                  </div>

                  {/* Visitante */}
                  <div className="flex flex-col items-center gap-2 flex-1 text-center">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/[0.04] border border-white/10 p-2 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                      {awayCrest ? (
                        <img
                          src={awayCrest}
                          alt={match.awayTeam}
                          className="w-full h-full object-contain drop-shadow"
                          loading="lazy"
                        />
                      ) : (
                        <span className="font-bold text-sm text-white font-mono">
                          {match.awayTeam.slice(0, 3).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="block font-bold text-xs sm:text-sm text-white leading-tight">
                        {match.awayTeam}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">Visitante</span>
                    </div>
                  </div>
                </div>

                {/* Subtítulo / Razón táctica del duelo */}
                <div className="relative z-10 my-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                  <div className="text-[11px] font-semibold text-slate-200 truncate">
                    {match.subtitle || "Duelo Táctico Destacado"}
                  </div>
                  {match.highlightReason && (
                    <div className="text-[9px] text-slate-400 line-clamp-1 mt-0.5 font-sans">
                      {match.highlightReason}
                    </div>
                  )}
                </div>

                {/* Botón CTA Brillante "Simular Duelo" */}
                <div className="relative z-10 pt-1">
                  <Link
                    href={simulateUrl}
                    onClick={() => handleSimulateClick(match)}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer min-h-[42px] touch-manipulation active:scale-[0.98] shadow-lg ${isMatchUcl
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/25 hover:shadow-cyan-500/40 border border-cyan-400/30"
                        : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black shadow-emerald-500/25 hover:shadow-emerald-500/40 border border-emerald-400/30"
                      }`}
                  >
                    <span>Simular Duelo</span>
                    <span className="text-sm">⚡</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer de la sección con mención explícita de la próxima jornada */}
        <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 font-mono pt-3 border-t border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-emerald-400">✓</span>
            <span>Calendario sincronizado con los próximos partidos de la jornada que viene</span>
          </div>
          <Link
            href="/xg-engine"
            className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors"
          >
            <span>Abrir Simulador Libre</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

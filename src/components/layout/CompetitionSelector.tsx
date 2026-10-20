"use client";

import React, { useState, useRef, useEffect } from "react";
import { useCompetition, CompetitionType } from "@/stores/filterStore";

export default function CompetitionSelector() {
  const { competition, setCompetition, meta } = useCompetition();
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (comp: CompetitionType) => {
    setCompetition(comp);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-flex items-center">
      {/* Botón Selector Principal */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 h-9 sm:h-8 px-3 sm:px-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 border cursor-pointer select-none shadow-sm touch-manipulation active:scale-95 z-30 ${
          competition === "ucl"
            ? "bg-sky-500/15 text-sky-200 border-sky-500/35 hover:bg-sky-500/25 shadow-[0_0_15px_rgba(56,189,248,0.2)]"
            : "bg-emerald-500/15 text-emerald-200 border-emerald-500/35 hover:bg-emerald-500/25 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
        }`}
        title="Cambiar competición activa"
        aria-expanded={isOpen}
      >
        {competition === "ucl" ? (
          // Icono Estrella / Champions League
          <svg className="w-3.5 h-3.5 text-sky-400 shrink-0 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.4 7.4h7.6l-6.1 4.5 2.3 7.1-6.2-4.4-6.2 4.4 2.3-7.1-6.1-4.5h7.6z" />
          </svg>
        ) : (
          // Icono Escudo / LaLiga
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981] shrink-0" />
        )}

        {/* Compacto en móviles (< sm) para no apretar la barra */}
        <span className="tracking-tight font-bold sm:hidden">
          {competition === "ucl" ? "UCL" : "LaLiga"}
        </span>
        <span className="tracking-tight hidden sm:inline 2xl:hidden">{meta.shortName}</span>
        <span className="tracking-tight hidden 2xl:inline">{meta.name}</span>

        <span className="hidden sm:inline-block font-mono text-[10px] text-slate-400 opacity-80 border-l border-white/10 pl-1.5">
          {meta.season}
        </span>

        {/* Chevron desplegable */}
        <svg
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Menú Desplegable Flotante */}
      {isOpen && (
        <>
          {/* Backdrop que atrapa toques fuera */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] touch-manipulation"
            onClick={() => setIsOpen(false)}
          />

          <div
            className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-slate-950 border border-white/15 shadow-2xl p-2 z-50 animate-scale-in"
          >
          <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase text-slate-500 tracking-wider">
            Competiciones Disponibles
          </div>

          <div className="space-y-1.5">
            {/* Opción 1: LaLiga EA Sports */}
            <button
              type="button"
              onClick={() => handleSelect("laliga")}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer text-left min-h-[48px] touch-manipulation active:scale-[0.98] ${
                competition === "laliga"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-white/[0.06] active:bg-white/10 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
                </div>
                <div>
                  <div className="font-semibold text-white">LaLiga EA Sports</div>
                  <div className="text-[10px] font-mono text-slate-400">20 Equipos · 2026-27</div>
                </div>
              </div>
              {competition === "laliga" && (
                <span className="text-emerald-400 font-mono text-base font-bold">✓</span>
              )}
            </button>

            {/* Opción 2: Champions League */}
            <button
              type="button"
              onClick={() => handleSelect("ucl")}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-all duration-150 cursor-pointer text-left min-h-[48px] touch-manipulation active:scale-[0.98] ${
                competition === "ucl"
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold shadow-sm"
                  : "text-slate-300 hover:text-white hover:bg-white/[0.06] active:bg-white/10 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/25 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-sky-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l2.4 7.4h7.6l-6.1 4.5 2.3 7.1-6.2-4.4-6.2 4.4 2.3-7.1-6.1-4.5h7.6z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-white">Champions League</div>
                  <div className="text-[10px] font-mono text-slate-400">36 Equipos · Fase Liga</div>
                </div>
              </div>
              {competition === "ucl" && (
                <span className="text-sky-400 font-mono text-base font-bold">✓</span>
              )}
            </button>
          </div>
        </div>
      </>
      )}
    </div>
  );
}

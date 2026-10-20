"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import PageContainer from "@/components/layout/PageContainer";
import CompetitionSelector from "@/components/layout/CompetitionSelector";
import { useCompetition, CompetitionType } from "@/stores/filterStore";

export default function Navbar() {
  const pathname = usePathname();
  const { competition, isUcl, meta, setCompetition } = useCompetition();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Cerrar el menú móvil automáticamente al cambiar de ruta
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Bloquear scroll del body al abrir el drawer móvil
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const navItems = [
    {
      href: "/xg-engine",
      label: "Motor xG",
      badge: "NUEVO",
      icon: (
        <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <rect x="9" y="9" width="6" height="6" />
          <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3" />
        </svg>
      )
    },
    {
      href: "/dashboard",
      label: "Command Center",
      icon: (
        <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </svg>
      )
    },
    {
      href: "/matches",
      label: "Match Intel",
      icon: (
        <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polygon points="12 6 12 12 16 14" />
        </svg>
      )
    },
    {
      href: "/players",
      label: "Jugadores",
      icon: (
        <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M6 20v-2a6 6 0 0 1 12 0v2" />
        </svg>
      )
    },
    {
      href: "/teams",
      label: "Clasificación",
      icon: (
        <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 20V10M12 20V4M6 20v-6" />
        </svg>
      )
    }
  ];

  const handleMobileCompetition = (comp: CompetitionType) => {
    setCompetition(comp);
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-md transition-all duration-300 ${
        isUcl
          ? "bg-[#030614]/90 border-cyan-500/20 shadow-[0_4px_30px_rgba(56,189,248,0.06)]"
          : "bg-slate-950/85 border-white/10"
      }`}
    >
      <PageContainer className="h-16 flex items-center justify-between gap-2 sm:gap-4 lg:gap-6">
        
        {/* Logo xG Nexus adaptativo (LaLiga / UCL) */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 shrink-0 group select-none">
          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden transition-all duration-300 group-hover:scale-105 shadow-lg border relative bg-[#070e1b] shrink-0 ${
              isUcl
                ? "border-cyan-400/40 shadow-cyan-500/25 group-hover:border-cyan-400/80 shadow-[0_0_15px_rgba(56,189,248,0.25)]"
                : "border-emerald-500/35 shadow-emerald-500/20 group-hover:border-emerald-500/70 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            }`}
          >
            <img
              src={isUcl ? "/images/logo-ucl.png" : "/images/logo-laliga.png"}
              alt={isUcl ? "xG Nexus Champions Edition" : "xG Nexus LaLiga"}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="flex flex-col">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span
                className={`block font-extrabold tracking-tight text-lg sm:text-xl leading-none transition-colors ${
                  isUcl ? "text-white group-hover:text-cyan-300" : "text-white group-hover:text-emerald-400"
                }`}
              >
                xG Nexus
              </span>
              {isUcl ? (
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-mono text-[8px] sm:text-[9px] font-bold tracking-wider shadow-[0_0_10px_rgba(56,189,248,0.2)]">
                  UCL
                </span>
              ) : (
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[8px] sm:text-[9px] font-bold tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                  LALIGA
                </span>
              )}
            </div>
            <span className="lbl hidden sm:block mt-0.5 sm:mt-1 font-mono text-[10px] text-slate-400" style={{ letterSpacing: ".08em" }}>
              {isUcl ? "Champions Telemetry" : "Inteligencia Táctica"}
            </span>
          </span>
        </Link>

        {/* Desktop Navigation (>= md) */}
        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex items-center gap-1 lg:gap-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href} className="shrink-0">
                  <Link
                    href={item.href}
                    prefetch={true}
                    className={`relative flex items-center gap-2 px-3 lg:px-3.5 py-2 rounded-xl text-xs lg:text-sm font-medium whitespace-nowrap transition-all duration-150 ${
                      isActive
                        ? isUcl
                          ? "bg-cyan-500/15 text-cyan-300 border border-cyan-400/40 shadow-[0_0_20px_-3px_rgba(56,189,248,0.3)]"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)]"
                        : "text-slate-400 hover:text-white hover:bg-white/[0.05] border border-transparent"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <span className={isActive ? (isUcl ? "text-cyan-300" : "text-emerald-400") : "text-slate-400"}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                    {item.badge && !isActive && (
                      <span className={`text-[8px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                        isUcl ? "bg-cyan-500/20 text-cyan-300" : "bg-emerald-500/20 text-emerald-400"
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isUcl ? "bg-cyan-400 shadow-[0_0_8px_#38bdf8]" : "bg-emerald-400 shadow-[0_0_8px_#10b981]"
                        }`}
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <CompetitionSelector />

          {/* Botón Hamburguesa Móvil (< md) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden flex items-center justify-center w-11 h-11 rounded-xl border transition-all duration-200 cursor-pointer touch-manipulation active:scale-95 ${
              isMobileMenuOpen
                ? isUcl
                  ? "bg-cyan-500/20 border-cyan-400/50 text-cyan-300"
                  : "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                : "bg-white/[0.06] border-white/10 text-slate-300 hover:bg-white/[0.1] active:bg-white/[0.15]"
            }`}
            aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isMobileMenuOpen}
          >
            <div className="w-5 h-4 flex flex-col justify-between items-center relative pointer-events-none">
              <span
                className={`block h-0.5 w-5 rounded-full bg-current transform transition-all duration-300 origin-center ${
                  isMobileMenuOpen ? "rotate-45 translate-y-[7px]" : ""
                }`}
              />
              <span
                className={`block h-0.5 w-5 rounded-full bg-current transition-all duration-200 ${
                  isMobileMenuOpen ? "opacity-0 scale-x-0" : ""
                }`}
              />
              <span
                className={`block h-0.5 w-5 rounded-full bg-current transform transition-all duration-300 origin-center ${
                  isMobileMenuOpen ? "-rotate-45 -translate-y-[7px]" : ""
                }`}
              />
            </div>
          </button>
        </div>
      </PageContainer>

      {/* ─── Mobile Drawer Overlay & Sheet (< md) ─── */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-50 md:hidden flex flex-col">
          {/* Backdrop con desenfoque (z-10, solo intercepta clics fuera del sheet) */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in cursor-pointer z-10 touch-manipulation"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Sheet / Menú Desplegable (z-20 por encima del backdrop) */}
          <div
            className={`relative z-20 w-full max-h-[calc(100vh-4rem)] overflow-y-auto border-b p-5 shadow-2xl flex flex-col gap-5 animate-slide-down pb-safe ${
              isUcl
                ? "bg-[#060b24]/98 border-cyan-500/30 shadow-[0_20px_50px_rgba(56,189,248,0.15)]"
                : "bg-slate-950/98 border-emerald-500/30 shadow-[0_20px_50px_rgba(16,185,129,0.15)]"
            }`}
          >
            {/* Selector Rápido de Competición en Móvil */}
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
              <div className="text-[11px] font-mono text-slate-400 mb-2.5 uppercase tracking-wider flex items-center justify-between">
                <span>Competición Activa</span>
                <span className="text-white font-bold">{meta.season}</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleMobileCompetition("laliga")}
                  className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold transition-all min-h-[46px] cursor-pointer touch-manipulation active:scale-[0.98] ${
                    competition === "laliga"
                      ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25 ring-2 ring-emerald-400/40"
                      : "bg-white/[0.06] text-slate-300 hover:bg-white/10 active:bg-white/15"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>LaLiga EA Sports</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleMobileCompetition("ucl")}
                  className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold transition-all min-h-[46px] cursor-pointer touch-manipulation active:scale-[0.98] ${
                    competition === "ucl"
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25 ring-2 ring-cyan-400/40"
                      : "bg-white/[0.06] text-slate-300 hover:bg-white/10 active:bg-white/15"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span>Champions League</span>
                </button>
              </div>
            </div>

            {/* Lista de Enlaces Táctiles de Navegación */}
            <nav aria-label="Menú móvil completo">
              <ul className="flex flex-col gap-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        prefetch={true}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-semibold transition-all min-h-[50px] cursor-pointer touch-manipulation active:scale-[0.98] ${
                          isActive
                            ? isUcl
                              ? "bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 shadow-sm"
                              : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 shadow-sm"
                            : "text-slate-200 bg-white/[0.02] hover:bg-white/[0.06] active:bg-white/[0.1] border border-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`p-2 rounded-lg ${
                              isActive
                                ? isUcl
                                  ? "bg-cyan-400/20 text-cyan-300"
                                  : "bg-emerald-400/20 text-emerald-400"
                                : "bg-white/[0.05] text-slate-400"
                            }`}
                          >
                            {item.icon}
                          </span>
                          <span className="text-base text-left">{item.label}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {item.badge && (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                                isUcl
                                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
                                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                          <span className="text-slate-500 text-lg">›</span>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Pie de Drawer con Telemetría */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isUcl ? "bg-cyan-400" : "bg-emerald-400"}`} />
                <span>{isUcl ? "UEFA Champions League" : "LaLiga EA Sports"}</span>
              </div>
              <span className="text-[11px] text-slate-500">v2.0 Mobile Ready</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

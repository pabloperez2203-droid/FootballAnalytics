"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PageContainer from "@/components/layout/PageContainer";
import ShotLabSimulator from "@/components/xg-engine/ShotLabSimulator";
import MatchupOracle from "@/components/xg-engine/MatchupOracle";
import RegressionRadar from "@/components/xg-engine/RegressionRadar";
import { useCompetition } from "@/stores/filterStore";
import { CompetitionSeal } from "@/components/ui/CompetitionBranding";

type TabMode = "all" | "shotlab" | "oracle" | "regression";

function XgEngineContent() {
  const { competition, isUcl } = useCompetition();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabMode>("all");

  // Si la URL trae ?tool=oracle o ?local=... cambiar automáticamente a la pestaña de simulador
  useEffect(() => {
    if (!searchParams) return;
    const tool = searchParams.get("tool") || searchParams.get("tab");
    const hasMatch = searchParams.get("local") || searchParams.get("home");
    if (tool === "oracle" || hasMatch) {
      setActiveTab("oracle");
    } else if (tool === "shotlab") {
      setActiveTab("shotlab");
    } else if (tool === "regression") {
      setActiveTab("regression");
    }
  }, [searchParams]);

  const tabs: { id: TabMode; label: string; icon: string; count?: string }[] = [
    { id: "all", label: "Vista Completa (Bento)", icon: "grid" },
    { id: "shotlab", label: "Laboratorio de Tiro 3D", icon: "crosshair", count: "Interactivo" },
    { id: "oracle", label: "Simulador de Duelos", icon: "dice", count: "10.000 sims" },
    { id: "regression", label: "Detector de Espejismos", icon: "trending", count: "Regresión" },
  ];

  return (
    <div className="min-h-screen py-8 sm:py-10">
      <PageContainer>
        {/* Cabecera Principal */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <div className="flex items-center gap-3 mb-2.5">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase border shadow-sm ${
                    isUcl
                      ? "bg-cyan-500/10 border-cyan-400/30 text-cyan-300 shadow-[0_0_15px_rgba(56,189,248,0.2)]"
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full animate-ping ${isUcl ? "bg-cyan-400" : "bg-emerald-400"}`} />
                  MOTOR xG · TELEMETRÍA AVANZADA
                </span>
                <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                  {isUcl ? "UEFA Champions League (36 Clubes)" : "LaLiga EA Sports 2026"}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight flex items-center gap-3">
                <span>Motor xG & Simulador</span>
                <span
                  className={`text-transparent bg-clip-text ${
                    isUcl
                      ? "bg-gradient-to-r from-sky-400 via-cyan-300 to-amber-300"
                      : "bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400"
                  }`}
                >
                  Estocástico
                </span>
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
                Herramientas 100% interactivas de geometría de tiro, predicción de duelos bivariante con Poisson (10.000 simulaciones) y detección de regresión a la media.
              </p>
            </div>

            {/* Sello de competición */}
            <div className="hidden lg:flex items-center gap-3 shrink-0">
              <CompetitionSeal variant="badge" />
            </div>
          </div>

          {/* Selector de pestañas adaptable */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex overflow-x-auto no-scrollbar items-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-md w-full sm:w-auto">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    type="button"
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer shrink-0 min-h-[44px] sm:min-h-[36px] touch-manipulation active:scale-[0.98] ${
                      isActive
                        ? isUcl
                          ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25"
                          : "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25 font-bold"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.count && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                          isActive
                            ? isUcl
                              ? "bg-white/20 text-white"
                              : "bg-slate-950/20 text-slate-950"
                            : "bg-white/10 text-slate-400"
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Badges de soporte analítico */}
            <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isUcl ? "bg-cyan-400" : "bg-emerald-400"}`} />
                <span>Trigonometría Portería 7.32m</span>
              </span>
              <span className="text-white/20">•</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>Poisson + Dixon-Coles</span>
              </span>
            </div>
          </div>
        </div>

        {/* Contenido de la vista según la pestaña seleccionada */}
        <div className="space-y-10">
          {(activeTab === "all" || activeTab === "shotlab") && (
            <section id="shotlab" className="scroll-mt-6">
              {activeTab === "all" && (
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-2.5 h-2.5 rounded-full ${isUcl ? "bg-cyan-400" : "bg-emerald-400"}`} />
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Módulo 1: Laboratorio de Tiro Interactivo
                  </h2>
                </div>
              )}
              <ShotLabSimulator />
            </section>
          )}

          {(activeTab === "all" || activeTab === "oracle") && (
            <section id="oracle" className="scroll-mt-6">
              {activeTab === "all" && (
                <div className="flex items-center gap-2 mb-4 pt-4 border-t border-white/5">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Módulo 2: Simulador de Duelos & Matriz Poisson
                  </h2>
                </div>
              )}
              <MatchupOracle />
            </section>
          )}

          {(activeTab === "all" || activeTab === "regression") && (
            <section id="regression" className="scroll-mt-6">
              {activeTab === "all" && (
                <div className="flex items-center gap-2 mb-4 pt-4 border-t border-white/5">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Módulo 3: Detector de Espejismos & Regresión a la Media
                  </h2>
                </div>
              )}
              <RegressionRadar />
            </section>
          )}
        </div>
      </PageContainer>
    </div>
  );
}

export default function XgEnginePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen py-8 sm:py-10">
          <PageContainer>
            <div className="h-96 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse" />
          </PageContainer>
        </div>
      }
    >
      <XgEngineContent />
    </Suspense>
  );
}

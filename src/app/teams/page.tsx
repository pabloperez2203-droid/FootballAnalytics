"use client";

import React, { useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
import TeamComparator from "@/components/teams/TeamComparator";
import JusticeTable from "@/components/teams/JusticeTable";
import TacticalStyleMatrix from "@/components/teams/TacticalStyleMatrix";
import equiposRaw from "@/data/equipos_xg.json";
import { TeamXgData } from "@/components/teams/types";

export default function TeamsPage() {
  const teamsData: TeamXgData[] = equiposRaw as TeamXgData[];

  // Team comparison state (defaults: Barcelona vs Real Madrid)
  const [teamAName, setTeamAName] = useState<string>("Barcelona");
  const [teamBName, setTeamBName] = useState<string>("Real Madrid");

  // Selection callback when clicking from table or scatter matrix
  const handleQuickSelect = (teamName: string) => {
    if (teamName === teamAName) return;
    if (teamName !== teamBName) {
      // If team is neither, replace teamB (or teamA if clicking same)
      setTeamBName(teamName);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 py-6 sm:py-10">
      <PageContainer>
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono text-emerald-400 font-semibold tracking-wider uppercase">
              LaLiga EA Sports · Análisis Colectivo
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Laboratorio Táctico de Clubes
              </h1>
              <p className="text-sm sm:text-base text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Comparativa multidimensional de percentiles, auditoría de justicia clasificatoria (xPTS)
                y matriz de estilo táctico (Presión vs Profundidad).
              </p>
            </div>

            {/* Quick Stats Banner */}
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[10px]">Equipos</span>
                <span className="text-white font-bold text-sm">20</span>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div>
                <span className="text-slate-400 block text-[10px]">Jornadas</span>
                <span className="text-white font-bold text-sm">
                  {Math.max(...teamsData.map(t => t.matches_played), 1)}
                </span>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div>
                <span className="text-slate-400 block text-[10px]">Métricas Radar</span>
                <span className="text-emerald-400 font-bold text-sm">6 Ejes</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Main Sections */}
        <div className="space-y-8">
          {/* Section 1: Comparador Cara a Cara & Radar de Percentiles */}
          <section id="comparador">
            <TeamComparator
              teams={teamsData}
              teamAName={teamAName}
              teamBName={teamBName}
              onSelectTeamA={setTeamAName}
              onSelectTeamB={setTeamBName}
            />
          </section>

          {/* Section 2: La Tabla de la Justicia (Real vs xPTS) */}
          <section id="tabla-justicia">
            <JusticeTable
              teams={teamsData}
              onSelectTeam={handleQuickSelect}
              selectedTeamA={teamAName}
              selectedTeamB={teamBName}
            />
          </section>

          {/* Section 3: Matriz de Estilo Táctico (Presión vs Profundidad) */}
          <section id="matriz-estilo">
            <TacticalStyleMatrix
              teams={teamsData}
              onSelectTeam={handleQuickSelect}
              selectedTeamA={teamAName}
              selectedTeamB={teamBName}
            />
          </section>
        </div>
      </PageContainer>
    </div>
  );
}

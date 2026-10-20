"use client";

import React, { useState, useMemo } from "react";
import KpiCard from "@/components/dashboard/KpiCard";
import EfficiencyTable from "@/components/dashboard/EfficiencyTable";
import ScatterPlot from "@/components/dashboard/ScatterPlot";
import { useDashboardKpis } from "@/hooks/useDashboardKpis";
import PageContainer from "@/components/layout/PageContainer";
import { getTeamCrest } from "@/utils/crests";
import { useCompetition } from "@/stores/filterStore";
import { CompetitionSeal } from "@/components/ui/CompetitionBranding";

// IMPORT REAL DATA
import laligaRealTeams from "@/data/equipos_xg.json";
import laligaRealPlayers from "@/data/jugadores_xg.json";

// IMPORT UCL DATA
import equiposUclData from "@/data/equipos_ucl_xg.json";
import jugadoresUclData from "@/data/jugadores_ucl_xg.json";

// IMPORT SIMULATED DATA
import laligaSimulatedTeams from "@/data/equipos_2026-27_simulado.json";
import laligaSimulatedPlayers from "@/data/jugadores_2026-27_simulado.json";

// TOGGLE TO SWITCH BETWEEN SIMULATED AND REAL DATA
const USE_SIMULATED_DATA = false; // Set to true to use simulated data, false for real

export default function DashboardPage() {
  const { competition, meta } = useCompetition();
  const [activeTeam, setActiveTeam] = useState<string | null>(null);
  const [plotMode, setPlotMode] = useState<"teams" | "players">("teams");
  const [filterTeam, setFilterTeam] = useState<string>("ALL");
  const [minMinutesPlayer, setMinMinutesPlayer] = useState<number>(300);

  const rawTeams = competition === "ucl" ? (equiposUclData as unknown as typeof laligaRealTeams) : laligaRealTeams;
  const rawPlayers = competition === "ucl" ? (jugadoresUclData as unknown as typeof laligaRealPlayers) : laligaRealPlayers;

  const teamsData = USE_SIMULATED_DATA ? laligaSimulatedTeams : rawTeams;
  const playersData = USE_SIMULATED_DATA ? laligaSimulatedPlayers : rawPlayers;

  // Lista de todos los equipos para el filtro
  const allTeamNames = useMemo(() => Array.from(new Set(teamsData.map(t => t.team))).sort(), [teamsData]);

  // Pasamos todos los equipos a la tabla
  const maxAbsDiff = Math.max(...teamsData.map(t => Math.abs(t.diff_goals_xg)));

  const tableData = teamsData.map((t, index) => {
    return {
      rank: t.rank || index + 1,
      id: t.team,
      name: t.team,
      pj: t.matches_played,
      xg: t.xg_for,
      goals: t.goals_for,
      diff: t.diff_goals_xg,
      xg90: t.xg_per_match,
      xga: t.xg_against,
      ga: t.goals_against,
      diffXg: t.xg_for - t.xg_against,
      maxDiff: maxAbsDiff
    };
  });

  // ─── KPIs dinámicos calculados desde datos ─────────────────────
  const kpis = useDashboardKpis(teamsData, playersData, minMinutesPlayer);

  // ─── Scatter Plot Logic ───
  const plotData = useMemo(() => {
    let data = [];
    if (plotMode === "teams") {
      data = teamsData.map(t => ({
        id: t.team,
        label: t.team,
        team: t.team,
        subLabel: "",
        xg: t.xg_for,
        goals: t.goals_for,
        diff: t.diff_goals_xg
      }));
    } else {
      data = playersData
        .filter(p => filterTeam === "ALL" || p.team_name === filterTeam)
        .map(p => ({
          id: p.player_id.toString(),
          label: p.player_name,
          subLabel: p.team_name,
          xg: p.xg,
          goals: p.goals,
          diff: p.diff_goals_xg
        }));
    }
    return data;
  }, [plotMode, filterTeam, teamsData, playersData]);

  return (
    <PageContainer className="py-6 relative">
      {USE_SIMULATED_DATA && (
        <div className="absolute top-2 right-4 bg-orange-500/20 text-orange-400 border border-orange-500/50 px-3 py-1 rounded-full text-xs font-bold z-50 animate-pulse">
          DATOS SIMULADOS ACTIVOS
        </div>
      )}

      {/* Header con Badge alineado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 leading-none mb-2">
            <span className={`h-6 px-2.5 flex items-center justify-center rounded-lg text-xs font-medium whitespace-nowrap bg-white/[0.04] border gap-1.5 leading-none shadow-sm ${
              competition === 'ucl'
                ? 'text-cyan-400 border-cyan-500/20 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                : 'text-emerald-400 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                competition === 'ucl' ? 'bg-cyan-400 shadow-[0_0_6px_#06b6d4]' : 'bg-emerald-400 shadow-[0_0_6px_#10b981]'
              }`}></span>
              <span>{meta.name}</span>
            </span>
            <span className="h-6 px-2.5 flex items-center justify-center rounded-lg text-xs font-mono text-slate-400 bg-white/[0.03] border border-white/5 leading-none">
              {meta.season}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Centro de Mando Analítico
          </h1>
        </div>

        {/* Sello Oficial Decorativo de Competición */}
        <CompetitionSeal className="self-start sm:self-auto shrink-0" />
      </div>

      <main className="grid grid-cols-1 md:grid-cols-12 gap-4">

        {/* ── Scatter ── */}
        <ScatterPlot 
           plotData={plotData} 
           plotMode={plotMode} 
           setPlotMode={setPlotMode} 
           allTeamNames={allTeamNames} 
           filterTeam={filterTeam} 
           setFilterTeam={setFilterTeam} 
        />

        {/* ── KPIs ── */}
        <KpiCard
          className="md:col-span-4 bg-gradient-to-br from-emerald-900/20 to-transparent"
          title="xG por partido"
          delta={<span title="xG esperado del equipo por partido">Liga media: {kpis.leagueAvgXgPerMatch}</span>}
          deltaType="neu"
          value={(kpis.bestXgTeam.xg_per_match || 0).toFixed(2)}
          subtitle={`${kpis.bestXgTeam.team} · Temporada ${kpis.season}`}
        />

        <KpiCard
          className="md:col-span-4 bg-gradient-to-br from-emerald-700/25 via-emerald-900/10 to-transparent"
          style={{ borderColor: "rgba(16,185,129,.30)" }}
          title="Goles − xG"
          delta={<span title="Porcentaje de goles marcados por encima de su xG esperado">▲ {((kpis.bestOverperformer.diff_goals_xg / Math.max(kpis.bestOverperformer.xg_for, 1)) * 100).toFixed(0)}%</span>}
          deltaType="pos"
          value={`+${kpis.bestOverperformer.diff_goals_xg.toFixed(1)}`}
          valueClassName="text-[var(--em)]"
          subtitle={`${kpis.bestOverperformer.team} · Mayor sobrerrendimiento`}
        />

        {/* ── Ranking ── */}
        <EfficiencyTable data={tableData} activeTeam={activeTeam} onHoverTeam={setActiveTeam} />

        {/* ── Pichichi ── */}
        <KpiCard
          className="md:col-span-4"
          title="Pichichi de la Liga"
          value={kpis.pichichi ? `${kpis.pichichi.goals} Goles` : "N/A"}
          subtitle={kpis.pichichi ? `${kpis.pichichi.player_name} (${kpis.pichichi.team_name || kpis.pichichi.team})` : undefined}
          delta={
            kpis.pichichi ? (
              <span title="Goles respecto a xG esperado">
                {kpis.pichichi.diff_goals_xg >= 0 ? `+${Number(kpis.pichichi.diff_goals_xg).toFixed(1)}` : Number(kpis.pichichi.diff_goals_xg).toFixed(1)} G−xG
              </span>
            ) : undefined
          }
          deltaType={kpis.pichichi && kpis.pichichi.diff_goals_xg >= 0 ? "pos" : "neg"}
          imageUrl={
            kpis.pichichi?.player_name?.toLowerCase().includes("raphinha")
              ? "/images/raphinha.jpg"
              : (kpis.pichichi?.photo || "/images/raphinha.jpg")
          }
          crestUrl={getTeamCrest(kpis.pichichi?.team_name || kpis.pichichi?.team || "")}
        >
          {kpis.pichichi && (
            <div className="space-y-3 pt-3 border-t border-white/10">
              {/* Stats bars */}
              {[
                { label: "Goles", value: kpis.pichichi.goals, max: 20, color: "#10b981", isDec: false },
                { label: "npxG (sin penaltis)", value: kpis.pichichi.np_xg, max: 20, color: "#f59e0b", isDec: true },
                { label: "xG/90", value: kpis.pichichi.xg / (kpis.pichichi.minutes / 90 || 1), max: 1.5, color: "#3b82f6", isDec: true },
                { label: "Goles/90", value: kpis.pichichi.goals / (kpis.pichichi.minutes / 90 || 1), max: 1.5, color: "#10b981", isDec: true },
                { label: "Diferencia (G−xG)", value: kpis.pichichi.diff_goals_xg, max: 5, color: kpis.pichichi.diff_goals_xg > 0 ? "#10b981" : "#f97316", isDec: true, isDiff: true },
                { label: "xG Total", value: kpis.pichichi.xg, max: 20, color: "#f59e0b", isDec: true },
              ].map(stat => {
                const valNum = Number(stat.value);
                const displayVal = stat.isDec ? valNum.toFixed(2) : valNum;
                const formattedVal = stat.isDiff ? (valNum > 0 ? `+${displayVal}` : displayVal) : displayVal;

                return (
                  <div key={stat.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{stat.label}</span>
                      <span className="font-mono font-semibold text-slate-200">{formattedVal}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(100, (Math.abs(valNum) / stat.max) * 100)}%`,
                          background: stat.color,
                          opacity: 0.85,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="flex gap-3 text-xs mt-3 pt-3 font-mono border-t border-white/10 text-slate-400">
                <span>{kpis.pichichi.team_name}</span>
                <span>·</span>
                <span>{kpis.pichichi.matches || 0} partidos</span>
                <span>·</span>
                <span>{kpis.pichichi.minutes || 0} min</span>
              </div>
            </div>
          )}
        </KpiCard>

        {/* ── Conversión ── */}
        <section className="glass-card md:col-span-4 flex flex-col justify-between p-6 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 bg-gradient-to-br from-emerald-500/[0.07] to-transparent">
          <div>
            <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Conversión</div>
            <div className="text-3xl md:text-4xl font-mono font-bold tracking-tight text-white mt-3 tabular-nums">
              {kpis.pichichiConversion}%
            </div>
          </div>
          <div className="text-sm font-medium mt-4 flex flex-wrap items-center justify-between gap-2">
            <span className="text-emerald-400 font-mono text-xs font-semibold">▲ {kpis.pichichi ? kpis.pichichi.player_name.split(' ').pop() : ''}</span>
            <span className="text-xs font-mono text-slate-400">Liga media: {kpis.leagueAvgConv}%</span>
          </div>
        </section>

        {/* ── xG por tiro ── */}
        <section className="glass-card md:col-span-4 flex flex-col justify-between p-6 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 bg-gradient-to-br from-orange-500/[0.07] to-transparent">
          <div>
            <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">xG por tiro</div>
            <div className="text-3xl md:text-4xl font-mono font-bold tracking-tight text-white mt-3 tabular-nums">
              {kpis.pichichiXgPerShot}
            </div>
          </div>
          <div className="text-sm font-medium mt-4 flex flex-wrap items-center justify-between gap-2">
            <span className="text-orange-400 font-mono text-xs font-semibold">▼ {kpis.pichichi ? kpis.pichichi.player_name.split(' ').pop() : ''}</span>
            <span className="text-xs font-mono text-slate-400">Liga media: {kpis.leagueAvgXgPerShot}</span>
          </div>
        </section>



        {/* ── Insight ── */}
        {kpis.worstUnderperformingPlayer && (
          <KpiCard
            className="md:col-span-4 bg-gradient-to-br from-orange-900/25 to-transparent relative overflow-hidden"
            style={{ borderColor: "rgba(249,115,22,.28)" }}
            title="Alerta de regresión"
            value={`${kpis.worstUnderperformingPlayer.diff_goals_xg > 0 ? '+' : ''}${kpis.worstUnderperformingPlayer.diff_goals_xg.toFixed(1)}`}
            valueClassName="text-4xl text-[var(--or)]"
            subtitle={`${kpis.worstUnderperformingPlayer.player_name} (${kpis.worstUnderperformingPlayer.team_name}) · Minutos: ${kpis.worstUnderperformingPlayer.minutes}`}
            delta={kpis.worstUnderperformingPlayer.minutes < 300 ? <span className="text-orange-300 font-bold" title="Muestra estadística insuficiente">⚠️ Muestra pequeña</span> : <span title="Goles por debajo de lo esperado">▼ Infrarrendimiento</span>}
          />
        )}

      </main>
      <footer className="text-center text-xs mt-8" style={{ color: "var(--mut)" }}>
        Datos de {USE_SIMULATED_DATA ? "Simulación" : "Understat"} · Temporada {kpis.season}
      </footer>
    </PageContainer>
  );
}

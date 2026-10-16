"use client";

import React, { useState, useMemo } from "react";
import PageContainer from "@/components/layout/PageContainer";
import PlayerFilterBar, { PositionFilter } from "@/components/players/PlayerFilterBar";
import LeaderKpis from "@/components/players/LeaderKpis";
import StatisticalClones from "@/components/players/StatisticalClones";
import ShootingMatrix from "@/components/players/ShootingMatrix";
import PlayerScoutingTable from "@/components/players/PlayerScoutingTable";
import rawPlayersData from "@/data/jugadores_xg.json";
import rawUclPlayersData from "@/data/jugadores_ucl_xg.json";
import { RawPlayerData, PlayerComputedMetrics } from "@/components/players/types";
import { useCompetition } from "@/stores/filterStore";

export default function PlayersPage() {
  const { competition, meta } = useCompetition();
  const allRaw = (competition === "ucl" ? rawUclPlayersData : rawPlayersData) as RawPlayerData[];

  // 1. Transform raw players into computed metrics per 90
  const allComputedPlayers: PlayerComputedMetrics[] = useMemo(() => {
    return allRaw
      .filter(p => p.minutes > 0)
      .map(p => {
        const m = p.minutes;
        const p90Factor = 90 / m;

        const npxg90 = p.np_xg * p90Factor;
        const xa90 = p.xa * p90Factor;
        const threat90 = (p.np_xg + p.xa) * p90Factor;
        const xgChain90 = p.xg_chain * p90Factor;
        const xgBuildup90 = p.xg_buildup * p90Factor;
        const shots90 = p.shots * p90Factor;
        const keyPasses90 = p.key_passes * p90Factor;
        const goals90 = p.goals * p90Factor;

        const npxgPerShot = p.shots > 0 ? p.np_xg / p.shots : 0;
        const finishingDelta = p.goals - p.xg;

        return {
          ...p,
          p90: {
            npxg: Number(npxg90.toFixed(2)),
            xa: Number(xa90.toFixed(2)),
            threat: Number(threat90.toFixed(2)),
            xgChain: Number(xgChain90.toFixed(2)),
            xgBuildup: Number(xgBuildup90.toFixed(2)),
            shots: Number(shots90.toFixed(2)),
            keyPasses: Number(keyPasses90.toFixed(2)),
            goals: Number(goals90.toFixed(2))
          },
          npxgPerShot: Number(npxgPerShot.toFixed(3)),
          finishingDelta: Number(finishingDelta.toFixed(2))
        };
      });
  }, [allRaw]);

  // Teams list for dropdown
  const teamsList = useMemo(() => {
    const set = new Set<string>();
    allComputedPlayers.forEach(p => {
      if (p.team_name) set.add(p.team_name);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allComputedPlayers]);

  // Filters State (default minMinutes >= 450)
  const [positionFilter, setPositionFilter] = useState<PositionFilter>("ALL");
  const [selectedTeam, setSelectedTeam] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [minMinutes, setMinMinutes] = useState<number>(450);

  // Reference Player for Statistical Clones
  const [referencePlayerName, setReferencePlayerName] = useState<string>("Raphinha");

  // Keep reference player valid when dataset changes
  React.useEffect(() => {
    const exists = allComputedPlayers.some(p => p.player_name === referencePlayerName);
    if (!exists && allComputedPlayers.length > 0) {
      const fallback = allComputedPlayers.find(p => p.goals >= 4)?.player_name || allComputedPlayers[0].player_name;
      setReferencePlayerName(fallback);
    }
  }, [allComputedPlayers, referencePlayerName]);

  // Reset filters
  const handleResetFilters = () => {
    setPositionFilter("ALL");
    setSelectedTeam("ALL");
    setSearchQuery("");
    setMinMinutes(450);
  };

  // 2. Filtered players list
  const filteredPlayers = useMemo(() => {
    return allComputedPlayers.filter(p => {
      // Min minutes check
      if (p.minutes < minMinutes) return false;

      // Position filter
      if (positionFilter !== "ALL") {
        if (!p.position.includes(positionFilter)) return false;
      }

      // Team filter
      if (selectedTeam !== "ALL" && p.team_name !== selectedTeam) {
        return false;
      }

      // Search query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.player_name.toLowerCase().includes(q);
        const matchesTeam = p.team_name.toLowerCase().includes(q);
        if (!matchesName && !matchesTeam) return false;
      }

      return true;
    });
  }, [allComputedPlayers, minMinutes, positionFilter, selectedTeam, searchQuery]);

  // Dynamic max minutes across all players (rounded up to nearest multiple of 90)
  const maxMinutesLimit = useMemo(() => {
    if (!allComputedPlayers.length) return 720;
    const maxM = Math.max(...allComputedPlayers.map(p => p.minutes));
    return Math.max(Math.ceil(maxM / 90) * 90, 720);
  }, [allComputedPlayers]);

  // Pool for Clones Engine: eligible players with at least minMinutes or 300m
  const clonesEligiblePool = useMemo(() => {
    return allComputedPlayers.filter(p => p.minutes >= Math.min(minMinutes, 300));
  }, [allComputedPlayers, minMinutes]);

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 py-6 sm:py-10">
      <PageContainer>
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-mono font-semibold tracking-wider uppercase ${
              competition === 'ucl' ? 'text-cyan-400' : 'text-emerald-400'
            }`}>
              {meta.name} · Inteligencia de Jugadores
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Scouting & Eficiencia de Jugadores
              </h1>
              <p className="text-sm sm:text-base text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Módulo analítico avanzado: detección de outliers de rendimiento por 90', motor de similitud
                vectorial de perfiles y cuadrantes de rematadores.
              </p>
            </div>

            {/* Quick Stats Pill */}
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[10px]">Base Jugadores</span>
                <span className="text-white font-bold text-sm">{allComputedPlayers.length}</span>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div>
                <span className="text-slate-400 block text-[10px]">Filtrados</span>
                <span className="text-emerald-400 font-bold text-sm">{filteredPlayers.length}</span>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div>
                <span className="text-slate-400 block text-[10px]">Corte Minutos</span>
                <span className="text-cyan-400 font-bold text-sm">≥{minMinutes}m</span>
              </div>
            </div>
          </div>
        </div>

        {/* Module Content */}
        <div className="space-y-8">
          {/* Tool 1: Filtros Rápidos & KPIs de Líderes */}
          <section id="filtros-kpis" className="space-y-4">
            <PlayerFilterBar
              position={positionFilter}
              onChangePosition={setPositionFilter}
              selectedTeam={selectedTeam}
              onChangeTeam={setSelectedTeam}
              teamsList={teamsList}
              searchQuery={searchQuery}
              onChangeSearch={setSearchQuery}
              minMinutes={minMinutes}
              onChangeMinMinutes={setMinMinutes}
              maxMinutesLimit={maxMinutesLimit}
              filteredCount={filteredPlayers.length}
              totalCount={allComputedPlayers.length}
              onResetFilters={handleResetFilters}
            />

            <LeaderKpis
              players={filteredPlayers}
              onSelectPlayer={setReferencePlayerName}
            />
          </section>

          {/* Tool 2: Buscador de "Clones Estadísticos" */}
          <section id="clones-estadisticos">
            <StatisticalClones
              allEligiblePlayers={clonesEligiblePool}
              referencePlayerName={referencePlayerName}
              onSelectReferencePlayer={setReferencePlayerName}
            />
          </section>

          {/* Tool 3: Matriz "Francotiradores vs Metralletas" */}
          <section id="matriz-tiros">
            <ShootingMatrix
              players={filteredPlayers}
              onSelectPlayer={setReferencePlayerName}
              selectedPlayerName={referencePlayerName}
            />
          </section>

          {/* Tool 3 Part 2: Tabla de Scouting */}
          <section id="tabla-scouting">
            <PlayerScoutingTable
              players={filteredPlayers}
              onSelectPlayer={setReferencePlayerName}
              selectedPlayerName={referencePlayerName}
            />
          </section>
        </div>
      </PageContainer>
    </div>
  );
}

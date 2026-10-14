"use client";

import React, { useEffect, useState } from 'react';
import simulatedData from '@/data/simulado/match_intel_simulado.json';

import MatchSelector from '@/components/match-intel/MatchSelector';
import MatchHeader from '@/components/match-intel/MatchHeader';
import XgTimelineChart from '@/components/match-intel/XgTimelineChart';
import VerdictPanel from '@/components/match-intel/VerdictPanel';
import ShotMap from '@/components/match-intel/ShotMap';
import StatsComparison from '@/components/match-intel/StatsComparison';
import ShotTimelineTable from '@/components/match-intel/ShotTimelineTable';
import MatchPlayersTable from '@/components/match-intel/MatchPlayersTable';
import MatchLineups from '@/components/match-intel/MatchLineups';
import CustomAnalysisSlots from '@/components/match-intel/CustomAnalysisSlots';
import PageContainer from '@/components/layout/PageContainer';

const USE_SIMULATED_DATA = false;

export default function MatchIntelPage() {
  const [indexData, setIndexData] = useState<any[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [matchData, setMatchData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(!USE_SIMULATED_DATA);

  useEffect(() => {
    if (USE_SIMULATED_DATA) {
      setMatchData(simulatedData);
      return;
    }

    // Fetch index
    fetch('/data/matches/index.json')
      .then(res => res.json())
      .then(data => {
        setIndexData(data);
        if (data.length > 0) {
          // Select last match by default
          setSelectedMatchId(data[data.length - 1].id);
        }
      })
      .catch(err => console.error("Error fetching index:", err));
  }, []);

  useEffect(() => {
    if (USE_SIMULATED_DATA || !selectedMatchId) return;

    setIsLoading(true);
    fetch(`/data/matches/${selectedMatchId}.json`)
      .then(res => res.json())
      .then(data => {
        setMatchData(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching match data:", err);
        setIsLoading(false);
      });
  }, [selectedMatchId]);

  if (isLoading || !matchData) {
    return <div className="p-8 text-center text-slate-400">Cargando datos del partido...</div>;
  }

  // Extend matchData.match for the MatchSelector which expects matches_in_matchday
  const currentMatchday = matchData.match.matchday;
  const matchesInMatchday = indexData.filter(m => m.matchday === currentMatchday).map(m => ({
    id: m.id,
    label: `${m.home_team.substring(0, 3).toUpperCase()} ${m.home_score}-${m.away_score} ${m.away_team.substring(0, 3).toUpperCase()}`,
    home_team: m.home_team,
    away_team: m.away_team,
    home_score: m.home_score,
    away_score: m.away_score,
    needs_review: m.needs_review
  }));

  const selectorMatchData = {
    ...matchData.match,
    matches_in_matchday: matchesInMatchday.length > 0 ? matchesInMatchday : matchData.match.matches_in_matchday
  };

  return (
    <PageContainer className="py-6 relative">
      {matchData.is_simulated && (
        <div className="absolute top-2 right-4 bg-orange-500/20 text-orange-400 border border-orange-500/50 px-3 py-1 rounded-full text-xs font-bold z-50 animate-pulse">
          DATOS SIMULADOS ACTIVOS
        </div>
      )}

      {/* 1. Selector de partido */}
      <MatchSelector
        matchData={selectorMatchData}
        onSelectMatch={setSelectedMatchId}
        onSelectMatchday={(dir) => {
          // Find matchdays available
          const matchdays = Array.from(new Set(indexData.map(m => m.matchday))).sort((a, b) => a - b);
          const currentIndex = matchdays.indexOf(currentMatchday);
          if (dir === 'prev' && currentIndex > 0) {
            const prevMdMatches = indexData.filter(m => m.matchday === matchdays[currentIndex - 1]);
            if (prevMdMatches.length > 0) setSelectedMatchId(prevMdMatches[prevMdMatches.length - 1].id);
          } else if (dir === 'next' && currentIndex < matchdays.length - 1) {
            const nextMdMatches = indexData.filter(m => m.matchday === matchdays[currentIndex + 1]);
            if (nextMdMatches.length > 0) setSelectedMatchId(nextMdMatches[0].id);
          }
        }}
      />

      {/* 2. Cabecera */}
      <MatchHeader matchData={matchData.match} />

      {/* 3. Fila principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="md:col-span-2">
          <XgTimelineChart shots={matchData.shots} matchData={matchData.match} />
        </div>
        <div className="md:col-span-1">
          <VerdictPanel verdict={matchData.verdict} />
        </div>
      </div>

      {/* 4. Fila de detalle */}
      <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-4 mb-4">
        <div>
          <ShotMap shots={matchData.shots} matchData={matchData.match} />
        </div>
        <div>
          <StatsComparison stats={matchData.stats} />
        </div>
      </div>

      {/* 5. Fila de tablas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <MatchLineups rosters={matchData.rosters} matchData={matchData.match} playersStats={matchData.players} />
        </div>
        <div className="relative h-full min-h-[400px] md:min-h-0">
          <div className="md:absolute md:inset-0 h-full">
            <ShotTimelineTable shots={matchData.shots} />
          </div>
        </div>
      </div>

      {/* 6. Espacio para mis análisis */}
      <CustomAnalysisSlots />
    </PageContainer>
  );
}

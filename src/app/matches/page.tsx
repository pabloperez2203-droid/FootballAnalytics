"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import simulatedData from '@/data/simulado/match_intel_simulado.json';

import MatchSelector from '@/components/match-intel/MatchSelector';
import MatchHeader from '@/components/match-intel/MatchHeader';
import XgTimelineChart from '@/components/match-intel/XgTimelineChart';
import ShotMap from '@/components/match-intel/ShotMap';
import StatsComparison from '@/components/match-intel/StatsComparison';
import ShotTimelineTable from '@/components/match-intel/ShotTimelineTable';
import MatchPlayersTable from '@/components/match-intel/MatchPlayersTable';
import MatchLineups from '@/components/match-intel/MatchLineups';
import CustomAnalysisSlots from '@/components/match-intel/CustomAnalysisSlots';
import PageContainer from '@/components/layout/PageContainer';
import { getMatchTeamColors } from '@/utils/crests';
import { useCompetition } from '@/stores/filterStore';
import { CompetitionSeal } from '@/components/ui/CompetitionBranding';

const USE_SIMULATED_DATA = false;

// Client-side in-memory caches to make navigation between pages and competitions instant
const matchIndexCache = new Map<string, any[]>();
const matchDetailCache = new Map<string, any>();

function MatchIntelContent() {
  const { competition } = useCompetition();
  const searchParams = useSearchParams();
  const queryId = searchParams.get('id');

  const [indexData, setIndexData] = useState<any[]>(() => {
    const indexUrl = competition === 'ucl' ? '/data/matches/ucl_index.json' : '/data/matches/index.json';
    return matchIndexCache.get(indexUrl) || [];
  });
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [matchData, setMatchData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(!USE_SIMULATED_DATA);
  const [hoveredShotId, setHoveredShotId] = useState<string | number | null>(null);

  useEffect(() => {
    if (USE_SIMULATED_DATA) {
      setMatchData(simulatedData);
      setIsLoading(false);
      return;
    }

    const indexUrl = competition === 'ucl' ? '/data/matches/ucl_index.json' : '/data/matches/index.json';

    const handleData = (data: any[]) => {
      setIndexData(data);
      if (data.length > 0) {
        const targetId = queryId || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('id') : null);
        let chosenId: string;
        if (targetId && data.some((m: any) => String(m.id) === String(targetId))) {
          chosenId = String(targetId);
        } else {
          const maxMatchday = Math.max(...data.map((m: any) => Number(m.matchday) || 1));
          const latestMatches = data.filter((m: any) => Number(m.matchday) === maxMatchday);
          const defaultMatch = latestMatches[0] || data[data.length - 1];
          chosenId = String(defaultMatch.id);
        }
        setSelectedMatchId(chosenId);

        // Instant cache hit for match details
        if (matchDetailCache.has(chosenId)) {
          setMatchData(matchDetailCache.get(chosenId));
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    // Check memory cache first
    if (matchIndexCache.has(indexUrl)) {
      handleData(matchIndexCache.get(indexUrl)!);
      return;
    }

    setIsLoading(true);
    fetch(indexUrl)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        matchIndexCache.set(indexUrl, data);
        handleData(data);
      })
      .catch(err => {
        console.error("Error fetching index:", err);
        setIsLoading(false);
      });
  }, [competition]);

  // Sync if URL query param changes while component is already mounted
  useEffect(() => {
    if (queryId && indexData.length > 0 && indexData.some((m: any) => String(m.id) === String(queryId))) {
      setSelectedMatchId(String(queryId));
    }
  }, [queryId, indexData]);

  useEffect(() => {
    if (USE_SIMULATED_DATA || !selectedMatchId) return;

    if (matchDetailCache.has(selectedMatchId)) {
      setMatchData(matchDetailCache.get(selectedMatchId));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetch(`/data/matches/${selectedMatchId}.json`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        matchDetailCache.set(selectedMatchId, data);
        setMatchData(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching match data:", err);
        setIsLoading(false);
      });
  }, [selectedMatchId]);

  if (isLoading || !matchData) {
    return (
      <PageContainer className="py-16 text-center flex items-center justify-center min-h-[50vh]">
        <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-900/80 border border-white/10 text-slate-300 font-mono text-sm shadow-xl backdrop-blur-md">
          <span className={`w-2.5 h-2.5 rounded-full animate-ping ${competition === 'ucl' ? 'bg-cyan-400' : 'bg-emerald-400'}`} />
          <span>Cargando análisis de partido ({competition === 'ucl' ? 'Champions League' : 'LaLiga'})...</span>
        </div>
      </PageContainer>
    );
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

  // Colores corporativos dinámicos con contraste garantizado
  const homeTeam = matchData.match.home_team;
  const awayTeam = matchData.match.away_team;
  const { homeColor, awayColor } = getMatchTeamColors(homeTeam, awayTeam);

  return (
    <PageContainer className="py-6 relative">
      {matchData.is_simulated && (
        <div className="absolute top-2 right-4 bg-orange-500/20 text-orange-400 border border-orange-500/50 px-3 py-1 rounded-full text-xs font-bold z-50 animate-pulse">
          DATOS SIMULADOS ACTIVOS
        </div>
      )}

      {/* Page Title & Official Competition Seal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-mono font-semibold tracking-wider uppercase ${competition === 'ucl' ? 'text-cyan-400' : 'text-emerald-400'}`}>
              {competition === 'ucl' ? 'UEFA Champions League · Match Intel' : 'LaLiga EA Sports · Match Intel'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Auditoría de Partido en Profundidad
          </h1>
        </div>
        <CompetitionSeal className="self-start sm:self-auto shrink-0" />
      </div>

      {/* 1. Selector de partido */}
      <MatchSelector
        matchData={selectorMatchData}
        onSelectMatch={setSelectedMatchId}
        onSelectMatchday={(dir) => {
          // Find matchdays available
          const matchdays = Array.from(new Set(indexData.map(m => m.matchday))).sort((a: any, b: any) => a - b);
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
      <MatchHeader matchData={matchData.match} homeColor={homeColor} awayColor={awayColor} />

      {/* 3. Visualizadores de Tiros (xG Timeline + Shot Map) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <XgTimelineChart
          shots={matchData.shots}
          matchData={matchData.match}
          hoveredShotId={hoveredShotId}
          onHoverShot={setHoveredShotId}
          homeColor={homeColor}
          awayColor={awayColor}
        />
        <ShotMap
          shots={matchData.shots}
          matchData={matchData.match}
          hoveredShotId={hoveredShotId}
          onHoverShot={setHoveredShotId}
          homeColor={homeColor}
          awayColor={awayColor}
        />
      </div>

      {/* 4. Comparativa de Estadísticas (Panel Completo / Tug-of-War) */}
      <div className="mb-4">
        <StatsComparison
          stats={matchData.stats}
          shots={matchData.shots}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          homeScore={matchData.match.home_score}
          awayScore={matchData.match.away_score}
          homeColor={homeColor}
          awayColor={awayColor}
        />
      </div>

      {/* 5. Alineaciones y Feed Visual de Ocasiones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div>
          <MatchLineups rosters={matchData.rosters} matchData={matchData.match} playersStats={matchData.players} />
        </div>
        <div>
          <ShotTimelineTable
            shots={matchData.shots}
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            hoveredShotId={hoveredShotId}
            onHoverShot={setHoveredShotId}
            homeColor={homeColor}
            awayColor={awayColor}
          />
        </div>
      </div>

      {/* 6. Espacio para mis análisis */}
      <CustomAnalysisSlots
        shots={matchData.shots}
        homeTeam={matchData.match.home_team}
        awayTeam={matchData.match.away_team}
        homeScore={matchData.match.home_score}
        awayScore={matchData.match.away_score}
        stats={matchData.stats}
      />
    </PageContainer>
  );
}

export default function MatchIntelPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Cargando Match Intel...</div>}>
      <MatchIntelContent />
    </Suspense>
  );
}

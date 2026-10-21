"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { getTeamCrest } from '@/utils/crests';
import { useCompetition, CompetitionType } from '@/stores/filterStore';
import LiveMatchCenterModal from '@/components/live/LiveMatchCenterModal';
import { LiveMatchData } from '@/app/api/live-matches/route';

export interface MatchItem {
  id: string;
  matchday: number;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  home_xg: number;
  away_xg: number;
  date?: string;
  status?: "LIVE" | "HT" | "FT" | "NS";
  minute?: string;
}

// ─── Datos de respaldo estáticos garantizados ──────────────────────────────
const DEFAULT_LALIGA_MATCHES: MatchItem[] = [
  { id: "30854", matchday: 9, home_team: "Getafe", away_team: "Rayo Vallecano", home_score: 1, away_score: 1, home_xg: 0.90, away_xg: 2.29 },
  { id: "30857", matchday: 9, home_team: "Real Madrid", away_team: "Sevilla", home_score: 4, away_score: 1, home_xg: 2.13, away_xg: 1.32 },
  { id: "30850", matchday: 9, home_team: "Real Betis", away_team: "Barcelona", home_score: 2, away_score: 5, home_xg: 1.35, away_xg: 3.19 },
  { id: "30853", matchday: 9, home_team: "Espanyol", away_team: "Atletico Madrid", home_score: 0, away_score: 1, home_xg: 0.49, away_xg: 1.78 },
  { id: "30859", matchday: 9, home_team: "Villarreal", away_team: "Elche", home_score: 0, away_score: 0, home_xg: 2.30, away_xg: 0.22 },
  { id: "30858", matchday: 9, home_team: "Valencia", away_team: "Athletic Club", home_score: 0, away_score: 0, home_xg: 2.24, away_xg: 0.52 },
  { id: "30856", matchday: 9, home_team: "Osasuna", away_team: "Racing Santander", home_score: 2, away_score: 0, home_xg: 3.08, away_xg: 0.22 },
  { id: "30851", matchday: 9, home_team: "Celta Vigo", away_team: "Alaves", home_score: 2, away_score: 1, home_xg: 0.76, away_xg: 1.18 },
  { id: "30855", matchday: 9, home_team: "Malaga", away_team: "Real Sociedad", home_score: 2, away_score: 5, home_xg: 1.92, away_xg: 2.57 },
];

const DEFAULT_UCL_MATCHES: MatchItem[] = [
  { id: "ucl_6106234", matchday: 3, home_team: "Paris Saint-Germain", away_team: "Barcelona", home_score: 4, away_score: 2, home_xg: 3.70, away_xg: 2.47 },
  { id: "ucl_6106248", matchday: 3, home_team: "Liverpool", away_team: "Villarreal", home_score: 4, away_score: 3, home_xg: 2.37, away_xg: 1.58 },
  { id: "ucl_6106397", matchday: 3, home_team: "Stuttgart", away_team: "Atletico Madrid", home_score: 1, away_score: 1, home_xg: 1.59, away_xg: 0.89 },
  { id: "ucl_6106257", matchday: 3, home_team: "Manchester City", away_team: "AEK Athens", home_score: 5, away_score: 1, home_xg: 2.83, away_xg: 1.17 },
  { id: "ucl_6106277", matchday: 3, home_team: "Roma", away_team: "Slovan Bratislava", home_score: 4, away_score: 0, home_xg: 3.17, away_xg: 0.03 },
  { id: "ucl_6106422", matchday: 3, home_team: "Sabah FK", away_team: "Borussia Dortmund", home_score: 1, away_score: 2, home_xg: 1.49, away_xg: 3.78 },
  { id: "ucl_6106320", matchday: 3, home_team: "Napoli", away_team: "Bodo Glimt", home_score: 4, away_score: 3, home_xg: 1.53, away_xg: 2.92 },
  { id: "ucl_6106333", matchday: 3, home_team: "Fenerbahce", away_team: "Slavia Prague", home_score: 2, away_score: 2, home_xg: 1.07, away_xg: 1.48 },
  { id: "ucl_6106287", matchday: 3, home_team: "FC Porto", away_team: "PSV Eindhoven", home_score: 0, away_score: 1, home_xg: 1.58, away_xg: 1.91 },
];

// Caché en memoria para transiciones instantáneas sin recarga
const memoryCache: Record<CompetitionType, { matches: MatchItem[]; matchday: number }> = {
  laliga: { matches: DEFAULT_LALIGA_MATCHES, matchday: 9 },
  ucl: { matches: DEFAULT_UCL_MATCHES, matchday: 3 },
};

function safeNumber(val: any, fallback = 0): number {
  if (val === null || val === undefined || val === '') return fallback;
  const n = typeof val === 'number' ? val : Number(val);
  return isNaN(n) ? fallback : n;
}

function safeXg(val: any): string {
  if (val === null || val === undefined || val === '') return '0.00';
  const n = typeof val === 'number' ? val : Number(val);
  return isNaN(n) ? '0.00' : n.toFixed(2);
}

export default function MatchTicker() {
  const { competition, meta } = useCompetition();

  const [mounted, setMounted] = useState(false);
  const [matches, setMatches] = useState<MatchItem[]>(() => DEFAULT_LALIGA_MATCHES);
  const [matchday, setMatchday] = useState<number>(9);
  const [hasLiveGames, setHasLiveGames] = useState<boolean>(false);

  // Modal de Centro de Partidos en Directo
  const [isLiveModalOpen, setIsLiveModalOpen] = useState<boolean>(false);
  const [selectedLiveMatchId, setSelectedLiveMatchId] = useState<string | undefined>(undefined);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isInteractingRef = useRef<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. Cargar partidos base según competición
  useEffect(() => {
    const currentComp = competition === 'ucl' ? 'ucl' : 'laliga';
    const cached = memoryCache[currentComp];

    if (cached && cached.matches && cached.matches.length > 0) {
      setMatches(cached.matches);
      setMatchday(cached.matchday);
    } else {
      setMatches(currentComp === 'ucl' ? DEFAULT_UCL_MATCHES : DEFAULT_LALIGA_MATCHES);
      setMatchday(currentComp === 'ucl' ? 3 : 9);
    }

    const dataUrl = currentComp === 'ucl' ? '/data/matches/ucl_index.json' : '/data/matches/index.json';
    const controller = new AbortController();

    fetch(dataUrl, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: any) => {
        if (Array.isArray(data) && data.length > 0) {
          const validMatches: MatchItem[] = data
            .filter((m: any) => m && (m.home_team || m.homeTeam) && (m.away_team || m.awayTeam))
            .map((m: any) => ({
              id: String(m.id || `m-${Math.random()}`),
              matchday: safeNumber(m.matchday ?? m.matchweek, 1),
              home_team: String(m.home_team || m.homeTeam || 'Local'),
              away_team: String(m.away_team || m.awayTeam || 'Visitante'),
              home_score: safeNumber(m.home_score ?? m.homeGoals, 0),
              away_score: safeNumber(m.away_score ?? m.awayGoals, 0),
              home_xg: safeNumber(m.home_xg ?? m.homeXG, 0),
              away_xg: safeNumber(m.away_xg ?? m.awayXG, 0),
              date: m.date ? String(m.date) : undefined,
              status: m.status || "FT",
              minute: m.minute || "FT",
            }));

          if (validMatches.length > 0) {
            const maxMd = Math.max(...validMatches.map((m) => m.matchday));
            const latest = validMatches.filter((m) => m.matchday === maxMd);
            const chosen = latest.length > 0 ? latest : validMatches.slice(-10);

            memoryCache[currentComp] = {
              matches: chosen,
              matchday: maxMd,
            };

            setMatchday(maxMd);
            setMatches(chosen);
          }
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          const fallback = currentComp === 'ucl' ? DEFAULT_UCL_MATCHES : DEFAULT_LALIGA_MATCHES;
          setMatches(fallback);
        }
      });

    return () => {
      controller.abort();
    };
  }, [competition]);

  // 2. Polling Inteligente de Partidos en Directo (/api/live-matches) cada 60s
  const pollLiveScores = useCallback(async () => {
    try {
      const res = await fetch(`/api/live-matches?comp=${competition}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();

      if (data && Array.isArray(data.matches)) {
        const liveItems: LiveMatchData[] = data.matches.filter(
          (m: LiveMatchData) => m.status === "LIVE" || m.status === "HT"
        );

        if (liveItems.length > 0) {
          setHasLiveGames(true);

          // Convertir a MatchItem y fusionar al inicio del carrusel
          const mappedLive: MatchItem[] = liveItems.map((lm) => ({
            id: lm.id,
            matchday: 9,
            home_team: lm.home_team,
            away_team: lm.away_team,
            home_score: lm.home_score,
            away_score: lm.away_score,
            home_xg: lm.home_xg,
            away_xg: lm.away_xg,
            status: lm.status,
            minute: lm.minute,
            date: lm.date,
          }));

          setMatches((prev) => {
            // Evitar duplicados si ya estaban agregados
            const filteredPrev = prev.filter((p) => !mappedLive.some((lm) => lm.id === p.id));
            return [...mappedLive, ...filteredPrev];
          });
        } else {
          setHasLiveGames(false);
        }
      }
    } catch {
      // Ignorar silenciosamente si hay error de red temporal
    }
  }, [competition]);

  useEffect(() => {
    pollLiveScores();
    const interval = setInterval(pollLiveScores, 60000); // 60 segundos
    return () => clearInterval(interval);
  }, [pollLiveScores]);

  // 3. Duplicación para scroll infinito continuo sin saltos visuales
  const displayItems = useMemo(() => {
    const list = matches.length > 0 ? matches : (competition === 'ucl' ? DEFAULT_UCL_MATCHES : DEFAULT_LALIGA_MATCHES);
    let extended = [...list];
    while (extended.length < 10) {
      extended = [...extended, ...list];
    }
    return [...extended, ...extended];
  }, [matches, competition]);

  // 4. Auto-scroll suave asistido con requestAnimationFrame y pausa interactiva
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    let animId: number;
    let lastTime = performance.now();

    const scrollLoop = (currentTime: number) => {
      const delta = currentTime - lastTime;
      lastTime = currentTime;

      if (!isInteractingRef.current && el) {
        el.scrollLeft += (delta * 0.025);

        const halfWidth = el.scrollWidth / 2;
        if (halfWidth > 0 && el.scrollLeft >= halfWidth) {
          el.scrollLeft -= halfWidth;
        }
      }

      animId = requestAnimationFrame(scrollLoop);
    };

    animId = requestAnimationFrame(scrollLoop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [displayItems]);

  const isUcl = competition === 'ucl';

  // Al hacer clic en un partido del ticker:
  const handleMatchClick = (m: MatchItem, e: React.MouseEvent) => {
    if (m.status === "LIVE" || m.status === "HT" || m.id.startsWith("live_") || m.id.startsWith("espn_")) {
      e.preventDefault();
      setSelectedLiveMatchId(m.id);
      setIsLiveModalOpen(true);
    }
  };

  // Renderizador para cada tarjeta de partido
  const renderMatchCard = useCallback((m: MatchItem, idx: number) => {
    const homeTeam = m.home_team || 'Local';
    const awayTeam = m.away_team || 'Visitante';
    const homeCrest = getTeamCrest(homeTeam);
    const awayCrest = getTeamCrest(awayTeam);
    const homeScore = safeNumber(m.home_score, 0);
    const awayScore = safeNumber(m.away_score, 0);
    const homeXgStr = safeXg(m.home_xg);
    const awayXgStr = safeXg(m.away_xg);
    const isLive = m.status === 'LIVE' || m.status === 'HT';

    return (
      <Link
        key={`ticker-card-${m.id}-${idx}`}
        href={isLive ? "#" : `/matches?id=${m.id}`}
        prefetch={false}
        onClick={(e) => handleMatchClick(m, e)}
        className={`flex items-center gap-2.5 px-3 py-1 rounded-lg border transition-all duration-150 group/item whitespace-nowrap cursor-pointer shadow-sm shrink-0 select-none ${
          isLive
            ? "bg-rose-500/[0.08] border-rose-500/40 hover:bg-rose-500/[0.14] hover:border-rose-500/70"
            : "bg-white/[0.03] hover:bg-white/[0.08] border-white/5 hover:border-white/20"
        }`}
      >
        {/* Badge "LIVE" si está en juego */}
        {isLive && (
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/25 border border-rose-500/50 text-rose-300 text-[10px] font-mono font-black animate-pulse shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_#ef4444]" />
            <span>{m.minute || "LIVE"}</span>
          </div>
        )}

        {/* Local */}
        <div className="flex items-center gap-1.5 shrink-0">
          {homeCrest ? (
            <img
              src={homeCrest}
              alt={homeTeam}
              className="w-4 h-4 object-contain drop-shadow pointer-events-none"
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          ) : null}
          <span className="text-xs font-semibold text-slate-200 group-hover/item:text-white transition-colors">
            {homeTeam}
          </span>
        </div>

        {/* Marcador */}
        <div
          className={`px-1.5 py-0.5 rounded bg-black/60 border font-mono font-bold text-xs tabular-nums shrink-0 ${
            isLive
              ? 'text-rose-400 border-rose-500/40 font-black'
              : isUcl
              ? 'text-cyan-300 border-cyan-400/25 group-hover/item:border-cyan-400/50'
              : 'text-emerald-400 border-emerald-500/25 group-hover/item:border-emerald-500/50'
          }`}
        >
          {homeScore} - {awayScore}
        </div>

        {/* Visitante */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs font-semibold text-slate-200 group-hover/item:text-white transition-colors">
            {awayTeam}
          </span>
          {awayCrest ? (
            <img
              src={awayCrest}
              alt={awayTeam}
              className="w-4 h-4 object-contain drop-shadow pointer-events-none"
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          ) : null}
        </div>

        {/* Separador y Telemetría xG */}
        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 border-l border-white/10 pl-2 shrink-0">
          <span className="text-slate-500 text-[10px]">xG</span>
          <span className="text-slate-300 font-semibold">{homeXgStr}</span>
          <span className="text-slate-500">-</span>
          <span className="text-slate-300 font-semibold">{awayXgStr}</span>
        </div>
      </Link>
    );
  }, [isUcl]);

  return (
    <>
      <div
        aria-label="Resultados en directo y Expected Goals"
        className="w-full overflow-hidden bg-[#080b11]/95 border-b border-white/10 backdrop-blur-md select-none relative z-30 h-10 flex items-center"
      >
        <div className="flex items-center w-full h-full">
          {/* Etiqueta fija izquierda tipo broadcast interactiva */}
          <button
            type="button"
            onClick={() => setIsLiveModalOpen(true)}
            title="Abrir Centro de Partidos en Directo"
            className={`shrink-0 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 h-full border-r font-mono text-[10px] sm:text-[11px] font-bold tracking-wider uppercase z-20 shadow-md transition-all cursor-pointer hover:brightness-125 touch-manipulation active:scale-95 ${
              hasLiveGames
                ? 'bg-rose-950/80 border-rose-500/40 text-rose-300 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                : isUcl
                ? 'bg-[#0a1535] border-cyan-500/25 text-cyan-300'
                : 'bg-[#061814] border-emerald-500/25 text-emerald-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${hasLiveGames ? "bg-rose-500 animate-ping shadow-[0_0_8px_#ef4444]" : "animate-pulse"}`}
              style={hasLiveGames ? {} : {
                backgroundColor: meta.dotColor,
                boxShadow: `0 0 8px ${meta.dotColor}`,
              }}
            />
            <span className="tracking-widest whitespace-nowrap">
              {hasLiveGames ? "🔴 DIRECTO" : `${isUcl ? 'UCL' : 'LaLiga'} J${matchday}`}
            </span>
          </button>

          {/* Contenedor wrapper con overflow-hidden */}
          <div className="flex-1 overflow-hidden relative h-full flex items-center min-w-0">
            <div className="absolute left-0 top-0 bottom-0 w-6 z-10 pointer-events-none bg-gradient-to-r from-[#080b11] to-transparent" />
            <div className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none bg-gradient-to-l from-[#080b11] to-transparent" />

            {!mounted && (
              <div className="flex items-center gap-3 overflow-x-auto whitespace-nowrap no-scrollbar py-2 px-4 w-full">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={`skeleton-init-${i}`}
                    className="h-7 w-44 rounded-lg bg-white/[0.04] border border-white/5 shrink-0 animate-pulse"
                  />
                ))}
              </div>
            )}

            {mounted && (
              <div
                ref={scrollContainerRef}
                onMouseEnter={() => {
                  isInteractingRef.current = true;
                }}
                onMouseLeave={() => {
                  isInteractingRef.current = false;
                }}
                onTouchStart={() => {
                  isInteractingRef.current = true;
                }}
                onTouchEnd={() => {
                  setTimeout(() => {
                    isInteractingRef.current = false;
                  }, 1200);
                }}
                className="flex items-center gap-3 overflow-x-auto whitespace-nowrap no-scrollbar py-2 px-4 w-full h-full"
              >
                {displayItems.map((m, idx) => renderMatchCard(m, idx))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Interactivo del Live Match Center */}
      <LiveMatchCenterModal
        isOpen={isLiveModalOpen}
        onClose={() => {
          setIsLiveModalOpen(false);
          setSelectedLiveMatchId(undefined);
        }}
        initialMatchId={selectedLiveMatchId}
      />
    </>
  );
}

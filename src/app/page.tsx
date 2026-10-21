"use client";

import Link from "next/link";
import Image from "next/image";
import equiposData from "@/data/equipos_xg.json";
import equiposUclData from "@/data/equipos_ucl_xg.json";
import jugadoresData from "@/data/jugadores_xg.json";
import jugadoresUclData from "@/data/jugadores_ucl_xg.json";
import matchesIndex from "../../public/data/matches/index.json";
import matchesUclIndex from "../../public/data/matches/ucl_index.json";
import { getTeamCrest, getTeamColor } from "@/utils/crests";
import PageContainer from "@/components/layout/PageContainer";
import HeroCanvas3D from "@/components/ui/HeroCanvas3D";
import { useCompetition } from "@/stores/filterStore";
import { UclStarball } from "@/components/ui/CompetitionBranding";
import FeaturedMatchups from "@/components/home/FeaturedMatchups";

export default function HomePage() {
  const { competition, meta, isUcl } = useCompetition();

  const currentEquipos = competition === "ucl" ? equiposUclData : equiposData;
  const currentMatches = competition === "ucl" ? matchesUclIndex : matchesIndex;

  // 1. Equipo más sobre-rendidor (mayor Goles - xG)
  const bestOverperformer = [...currentEquipos].sort(
    (a, b) => b.diff_goals_xg - a.diff_goals_xg
  )[0] || currentEquipos[0];

  // 2. Equipo más generador (mayor xG total)
  const topXgTeam = [...currentEquipos].sort(
    (a, b) => b.xg_for - a.xg_for
  )[0] || currentEquipos[0];

  // 3. Partido Destacado (partido con mayor suma de xG en index.json)
  const featuredMatch = [...currentMatches].sort(
    (a, b) => (b.home_xg + b.away_xg) - (a.home_xg + a.away_xg)
  )[0] || currentMatches[0];

  const overperformerCrest = getTeamCrest(bestOverperformer.team);
  const overperformerColor = getTeamColor(bestOverperformer.team);

  const topXgCrest = getTeamCrest(topXgTeam.team);
  const topXgColor = getTeamColor(topXgTeam.team);

  const featuredHomeCrest = getTeamCrest(featuredMatch.home_team);
  const featuredAwayCrest = getTeamCrest(featuredMatch.away_team);
  const featuredHomeColor = getTeamColor(featuredMatch.home_team);
  const featuredAwayColor = getTeamColor(featuredMatch.away_team);

  const featuredTotalXg = (featuredMatch.home_xg + featuredMatch.away_xg).toFixed(2);

  // Jugador destacado en vivo (Raphinha)
  const raphinhaLaLiga = (jugadoresData as any[]).find(
    (p) =>
      p.player_name?.toLowerCase().includes("raphinha") ||
      p.player?.toLowerCase().includes("raphinha")
  ) || {
    player_name: "Raphinha",
    goals: 12,
    xg: 9.06,
    diff_goals_xg: 2.94,
    matches: 7,
    minutes: 577,
    team_name: "Barcelona",
  };

  const raphinhaUcl = (jugadoresUclData as any[]).find(
    (p) =>
      p.player_name?.toLowerCase().includes("raphinha") ||
      p.player?.toLowerCase().includes("raphinha")
  ) || {
    player_name: "Raphinha",
    goals: 2,
    xg: 0.7,
    diff_goals_xg: 1.3,
    matches: 1,
    minutes: 71,
    team_name: "Barcelona",
  };

  return (
    <div className="relative min-h-[calc(100vh-64px)] flex flex-col justify-between overflow-hidden">
      {/* Luces de fondo ambientales */}
      <div
        className={`absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none -z-10 transition-colors duration-700 ${
          isUcl ? "bg-cyan-500/15" : "bg-emerald-500/10"
        }`}
      />
      <div
        className={`absolute top-1/3 right-10 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none -z-10 transition-colors duration-700 ${
          isUcl ? "bg-blue-600/20" : "bg-blue-600/10"
        }`}
      />

      {/* ─── Hero Section (Estilo EA Sports / Opta Spotlight) ─────────────── */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 border-b border-white/5 overflow-hidden">
        {/* Iluminación ambiental detrás del jugador / estadio con los colores del club/competición */}
        <div
          className={`absolute -top-16 -right-16 w-[420px] h-[420px] lg:w-[620px] lg:h-[620px] rounded-full blur-3xl opacity-75 pointer-events-none -z-10 transition-all duration-700 ${
            isUcl
              ? "bg-gradient-to-br from-cyan-500/40 via-blue-600/35 to-indigo-950/60"
              : "bg-gradient-to-br from-blue-700/35 via-rose-600/25 to-amber-500/20"
          }`}
        />

        {/* Composición de Imagen Spotlight (Lado derecho/central-derecho) */}
        <div className="absolute right-0 top-0 bottom-0 w-full lg:w-[65%] pointer-events-none -z-10 overflow-hidden">
          <div className="relative w-full h-full">
            {/* Modo LaLiga: Raphinha Spotlight */}
            <div
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isUcl ? "opacity-0" : "opacity-100"
              }`}
            >
              <Image
                src="/images/raphinha.jpg"
                alt="Raphinha · Spotlight"
                fill
                priority
                quality={95}
                className="object-cover object-top lg:object-[center_top] contrast-110 saturate-110 brightness-95"
              />
            </div>

            {/* Modo Champions League: Estadio Nocturno de Élite */}
            <div
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                isUcl ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src="/images/ucl-hero.jpg"
                alt="UEFA Champions League Stage"
                fill
                priority
                quality={95}
                className="object-cover object-center contrast-110 saturate-110 brightness-95"
              />
            </div>

            {/* Doble máscara de fusión perfecta */}
            {/* 1. Degradado horizontal de izquierda a derecha (texto 100% legible sobre fondo oscuro puro) */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/75 to-transparent/30 pointer-events-none" />

            {/* 2. Degradado inferior para fundir con el resto de la página */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40 pointer-events-none" />
          </div>
        </div>

        {/* Balón 3D geodésico / Starball 3D interactivo en Canvas */}
        <div className="absolute inset-y-0 right-0 w-full lg:w-1/2 pointer-events-none -z-10 overflow-hidden flex items-center justify-center opacity-45 mix-blend-screen">
          <HeroCanvas3D />
        </div>

        <PageContainer>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Columna Izquierda: Copy & CTAs */}
            <div className="lg:col-span-7 max-w-2xl">
              {/* Pill de estado */}
              <Link
                href="/xg-engine"
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs mb-6 backdrop-blur-md shadow-sm transition-all duration-300 hover:scale-[1.02] group cursor-pointer ${
                  isUcl
                    ? "bg-[#070e2b]/80 border-cyan-400/35 text-cyan-200 shadow-[0_0_15px_rgba(56,189,248,0.2)] hover:border-cyan-400/70"
                    : "bg-white/[0.04] border-white/10 text-slate-300 hover:border-emerald-500/50 hover:text-emerald-300"
                }`}
              >
                {isUcl ? (
                  <>
                    <UclStarball className="w-3.5 h-3.5" animate glow={false} />
                    <span className="font-semibold text-cyan-400">MOTOR xG & SIMULADOR</span>
                    <span className="text-slate-500">|</span>
                    <span className="text-amber-300 font-mono font-medium">FASE DE LIGA (36 CLUBES)</span>
                    <span className="text-cyan-400 text-[10px] ml-1 group-hover:translate-x-0.5 transition-transform">→</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
                    <span className="font-semibold text-emerald-400">Motor xG 2.0</span>
                    <span className="text-slate-500">|</span>
                    <span>Inteligencia Táctica & Expected Goals</span>
                    <span className="text-emerald-400 text-[10px] ml-1 group-hover:translate-x-0.5 transition-transform">→</span>
                  </>
                )}
              </Link>

              {/* Título Principal */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15] flex flex-wrap items-center">
                <span>El fútbol no se intuye.</span>
                <span
                  className={`block w-full mt-2 text-transparent bg-clip-text ${
                    isUcl
                      ? "bg-gradient-to-r from-sky-400 via-cyan-300 to-amber-300"
                      : "bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400"
                  }`}
                >
                  Se cuantifica con xG.
                </span>
              </h1>

              {/* Subtítulo */}
              <p className="mt-5 sm:mt-6 text-sm sm:text-lg text-slate-300 leading-relaxed max-w-xl font-normal">
                {isUcl ? (
                  <>
                    Plataforma analítica oficial para la <strong className="text-white font-medium">UEFA Champions League</strong> (36 clubes).
                    Modelos de <strong className="text-white font-medium">Expected Goals (xG)</strong>, mapas de tiro europeos,
                    auditoría de mérito clasificatorio <strong className="text-white font-medium">xPTS</strong> y métricas de eficiencia en la élite continental.
                  </>
                ) : (
                  <>
                    Plataforma analítica de última generación para <strong className="text-white font-medium">{meta.name}</strong>. Modelos matemáticos de
                    <strong className="text-white font-medium"> Expected Goals (xG)</strong>, mapas de tiro,
                    presión <strong className="text-white font-medium">PPDA</strong> y métricas de eficiencia real de equipos y futbolistas.
                  </>
                )}
              </p>

              {/* CTAs Táctiles (Full-width en móvil, inline en tablet/desktop) */}
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <Link
                  href="/xg-engine"
                  className={`w-full sm:w-auto min-h-[48px] px-6 py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer ${
                    isUcl
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/25 hover:shadow-cyan-500/40"
                      : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 hover:shadow-emerald-500/35"
                  }`}
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Entrar al Motor xG</span>
                  <svg
                    className="w-4 h-4 transition-transform group-hover:translate-x-1 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>

                <Link
                  href="/dashboard"
                  className="glass-card w-full sm:w-auto min-h-[48px] px-5 py-3.5 rounded-xl text-white font-semibold text-sm hover:bg-white/[0.08] transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer"
                >
                  <span>Command Center</span>
                </Link>

                <Link
                  href="/matches"
                  className={`glass-card w-full sm:w-auto min-h-[48px] px-5 py-3.5 rounded-xl text-white font-semibold text-sm hover:bg-white/[0.08] transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer ${
                    isUcl ? "border-cyan-400/20" : ""
                  }`}
                >
                  <svg className={`w-4 h-4 shrink-0 ${isUcl ? "text-cyan-400" : "text-emerald-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Match Intel</span>
                </Link>
              </div>

              {/* Métricas destacadas en píldoras */}
              <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4 text-xs text-slate-400 font-mono">
                <div className="flex items-center gap-2 min-w-0 bg-white/[0.02] sm:bg-transparent p-2.5 sm:p-0 rounded-xl sm:rounded-none border border-white/5 sm:border-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                  <span className="text-white font-bold text-sm flex-shrink-0">{currentEquipos.length}</span>
                  <span className="truncate">Equipos monitorizados</span>
                </div>
                <Link href="/xg-engine" className="flex items-center gap-2 min-w-0 hover:text-white transition-colors group bg-white/[0.02] sm:bg-transparent p-2.5 sm:p-0 rounded-xl sm:rounded-none border border-white/5 sm:border-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0 animate-pulse" />
                  <span className="text-cyan-300 font-bold text-sm flex-shrink-0 group-hover:underline">Motor xG</span>
                  <span className="truncate">Laboratorio de tiro →</span>
                </Link>
                <div className="flex items-center gap-2 min-w-0 bg-white/[0.02] sm:bg-transparent p-2.5 sm:p-0 rounded-xl sm:rounded-none border border-white/5 sm:border-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  <span className="text-white font-bold text-sm flex-shrink-0">100%</span>
                  <span className="truncate">Métricas xG</span>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Tarjeta Flotante de Estadísticas centrada en móvil */}
            <div className="lg:col-span-5 flex justify-center items-center w-full mt-4 lg:mt-0">
              <div
                className={`w-full max-w-[420px] mx-auto rounded-2xl border backdrop-blur-xl p-5 sm:p-6 shadow-2xl transition-all duration-700 pointer-events-auto hover:-translate-y-1 group ${
                  isUcl
                    ? "bg-[#070e2b]/85 border-cyan-400/35 shadow-[0_20px_50px_rgba(56,189,248,0.22)]"
                    : "bg-slate-950/85 border-emerald-500/30 shadow-[0_20px_50px_rgba(16,185,129,0.18)]"
                }`}
              >
                {/* Header del Badge HUD */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex items-center justify-center w-2.5 h-2.5">
                      <span
                        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                          isUcl ? "bg-cyan-400" : "bg-emerald-400"
                        }`}
                      />
                      <span
                        className={`relative inline-flex rounded-full h-2 w-2 ${
                          isUcl
                            ? "bg-cyan-400 shadow-[0_0_8px_#38bdf8]"
                            : "bg-emerald-400 shadow-[0_0_8px_#10b981]"
                        }`}
                      />
                    </div>
                    <div>
                      <div
                        className={`text-[11px] font-extrabold tracking-wider font-mono uppercase transition-colors duration-700 ${
                          isUcl ? "text-cyan-300" : "text-emerald-400"
                        }`}
                      >
                        {isUcl ? "UEFA CHAMPIONS LEAGUE" : "RAPHINHA · MVP / LÍDER OFENSIVO"}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>{isUcl ? "Fase de Liga" : "FC Barcelona"}</span>
                        <span>•</span>
                        <span className={isUcl ? "text-amber-300 font-mono" : "text-slate-300"}>
                          {isUcl ? "36 Clubes Europeos" : "Extremo / Delantero"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors duration-700 flex items-center gap-1 ${
                      isUcl
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/30"
                        : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                    }`}
                  >
                    {isUcl ? (
                      <>
                        <UclStarball className="w-3 h-3" animate glow={false} />
                        <span>UCL LIVE</span>
                      </>
                    ) : (
                      <span>TOP 1</span>
                    )}
                  </div>
                </div>

                {/* Métricas HUD en Grid */}
                <div className="grid grid-cols-3 gap-2.5 my-4">
                  <div className="bg-white/[0.04] border border-white/5 rounded-xl p-2.5 text-center">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono font-medium">
                      {isUcl ? "Clubes" : "Goles"}
                    </div>
                    <div className="text-xl font-extrabold text-white mt-0.5 font-mono">
                      {isUcl ? "36" : raphinhaLaLiga.goals}
                    </div>
                    <div className={`text-[9px] font-mono mt-0.5 ${isUcl ? "text-cyan-400" : "text-emerald-400"}`}>
                      {isUcl ? "Élite UEFA" : "Real en Liga"}
                    </div>
                  </div>
                  <div className="bg-white/[0.04] border border-white/5 rounded-xl p-2.5 text-center">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono font-medium">
                      {isUcl ? "Partidos" : "xG Total"}
                    </div>
                    <div className="text-xl font-extrabold text-cyan-300 mt-0.5 font-mono">
                      {isUcl ? currentMatches.length : Number(raphinhaLaLiga.xg).toFixed(2)}
                    </div>
                    <div className="text-[9px] text-cyan-400 font-mono mt-0.5">
                      {isUcl ? "Jornadas 1-8" : "Generado"}
                    </div>
                  </div>
                  <div className="bg-white/[0.04] border border-white/5 rounded-xl p-2.5 text-center">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono font-medium">
                      {isUcl ? "Cobertura" : "Eficiencia"}
                    </div>
                    <div className="text-xl font-extrabold text-amber-300 mt-0.5 font-mono">
                      {isUcl
                        ? "100%"
                        : `+${Number(
                            raphinhaLaLiga.diff_goals_xg ??
                              raphinhaLaLiga.goals - raphinhaLaLiga.xg
                          ).toFixed(2)}`}
                    </div>
                    <div className="text-[9px] text-amber-400 font-mono mt-0.5">
                      {isUcl ? "xG & Mapas" : "Goles - xG"}
                    </div>
                  </div>
                </div>

                {/* Barra de telemetría inferior */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isUcl ? "bg-cyan-400" : "bg-emerald-400"}`}
                    />
                    <span>
                      {isUcl
                        ? `Raphinha UCL: ${raphinhaUcl.goals} Goles`
                        : `${raphinhaLaLiga.matches} partidos (${raphinhaLaLiga.minutes} min)`}
                    </span>
                  </span>
                  <span
                    className={`font-semibold tracking-wide ${
                      isUcl ? "text-cyan-300" : "text-emerald-400"
                    }`}
                  >
                    {isUcl
                      ? `${Number(raphinhaUcl.xg).toFixed(2)} xG (${raphinhaUcl.minutes} min)`
                      : `SOBRE-RENDIMIENTO +${Math.round(
                          ((raphinhaLaLiga.goals / (raphinhaLaLiga.xg || 1)) - 1) * 100
                        )}%`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* ─── Duelos de la Jornada (Featured Matchups Recommender) ─────────── */}
      <FeaturedMatchups />

      {/* ─── Bento Grid de Destacados ─────────────────────────────────────── */}
      <section className="py-12 md:py-16">
        <PageContainer>
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="lbl text-emerald-400 font-semibold tracking-wider">Centro de Mando {meta.shortName}</div>
              <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
                Destacados del Rendimiento Analítico
              </h2>
            </div>
            <Link
              href="/dashboard"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <span>Ver clasificación completa</span>
              <span>→</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Bento Card 1: Equipo más sobre-rendidor */}
            <div className="glass-card interactive-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between group hover:-translate-y-1">
              {/* Iluminación ambiental con color del equipo */}
              <div
                className="absolute -right-8 -top-8 w-36 h-36 rounded-full blur-3xl opacity-20 pointer-events-none group-hover:opacity-30 transition-opacity"
                style={{ backgroundColor: overperformerColor }}
              />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="lbl text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    Máximo Sobrerrendimiento
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {bestOverperformer.matches_played} PJ
                  </span>
                </div>

                <div className="flex items-center gap-3.5 mb-5">
                  <div
                    className="w-14 h-14 rounded-2xl p-2 bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-lg relative"
                    style={{ boxShadow: `0 0 20px -5px ${overperformerColor}40` }}
                  >
                    {overperformerCrest ? (
                      <img src={overperformerCrest} alt={bestOverperformer.team} className="w-full h-full object-contain" />
                    ) : (
                      <span className="font-bold text-lg">{bestOverperformer.team.substring(0, 3)}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white group-hover:text-emerald-400 transition-colors">
                      {bestOverperformer.team}
                    </h3>
                    <p className="text-xs text-slate-400">Efectividad letal de cara a portería</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/50 border border-white/5 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-slate-400">Diferencial (G − xG)</span>
                    <span className="font-mono text-2xl font-black text-emerald-400 tabular-nums">
                      +{bestOverperformer.diff_goals_xg.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 font-mono pt-2 border-t border-white/5">
                    <span>Goles marcados: <strong className="text-white">{bestOverperformer.goals_for}</strong></span>
                    <span>xG esperado: <strong className="text-slate-300">{bestOverperformer.xg_for.toFixed(1)}</strong></span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-400">Eficiencia ofensiva récord</span>
                <Link
                  href="/dashboard"
                  className="font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  Ver en Dashboard <span>→</span>
                </Link>
              </div>
            </div>

            {/* Bento Card 2: Equipo más generador */}
            <div className="glass-card interactive-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between group hover:-translate-y-1">
              {/* Iluminación ambiental con color del equipo */}
              <div
                className="absolute -right-8 -top-8 w-36 h-36 rounded-full blur-3xl opacity-20 pointer-events-none group-hover:opacity-30 transition-opacity"
                style={{ backgroundColor: topXgColor }}
              />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="lbl text-[10px] px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
                    Máxima Generación xG
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {topXgTeam.matches_played} PJ
                  </span>
                </div>

                <div className="flex items-center gap-3.5 mb-5">
                  <div
                    className="w-14 h-14 rounded-2xl p-2 bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-lg relative"
                    style={{ boxShadow: `0 0 20px -5px ${topXgColor}40` }}
                  >
                    {topXgCrest ? (
                      <img src={topXgCrest} alt={topXgTeam.team} className="w-full h-full object-contain" />
                    ) : (
                      <span className="font-bold text-lg">{topXgTeam.team.substring(0, 3)}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white group-hover:text-cyan-400 transition-colors">
                      {topXgTeam.team}
                    </h3>
                    <p className="text-xs text-slate-400">Mayor volumen de ocasiones creadas</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/50 border border-white/5 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-slate-400">Expected Goals Totales</span>
                    <span className="font-mono text-2xl font-black text-cyan-400 tabular-nums">
                      {topXgTeam.xg_for.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 font-mono pt-2 border-t border-white/5">
                    <span>xG / Partido: <strong className="text-white">{topXgTeam.xg_per_match.toFixed(2)}</strong></span>
                    <span>Goles reales: <strong className="text-slate-300">{topXgTeam.goals_for}</strong></span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-400">Volumen ofensivo de élite</span>
                <Link
                  href="/dashboard"
                  className="font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  Ver en ScatterPlot <span>→</span>
                </Link>
              </div>
            </div>

            {/* Bento Card 3: Partido Destacado */}
            <div className="glass-card interactive-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between group hover:-translate-y-1 border-emerald-500/20">
              {/* Iluminación dual local / visitante */}
              <div
                className="absolute -left-6 -top-6 w-32 h-32 rounded-full blur-3xl opacity-15 pointer-events-none"
                style={{ backgroundColor: featuredHomeColor }}
              />
              <div
                className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full blur-3xl opacity-15 pointer-events-none"
                style={{ backgroundColor: featuredAwayColor }}
              />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="lbl text-[10px] px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                    Partido Más Abierto & Espectacular
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    J{featuredMatch.matchday}
                  </span>
                </div>

                {/* Marcador del partido */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-white/5 mb-4">
                  {/* Home */}
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-8 h-8 rounded-full p-1 bg-white/5 shrink-0 flex items-center justify-center">
                      {featuredHomeCrest ? (
                        <img src={featuredHomeCrest} alt={featuredMatch.home_team} className="w-full h-full object-contain" />
                      ) : null}
                    </div>
                    <span className="font-semibold text-xs truncate">{featuredMatch.home_team}</span>
                  </div>

                  {/* Score */}
                  <div className="px-3 font-mono font-black text-xl text-white tabular-nums tracking-wider shrink-0">
                    {featuredMatch.home_score} - {featuredMatch.away_score}
                  </div>

                  {/* Away */}
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <span className="font-semibold text-xs truncate text-right">{featuredMatch.away_team}</span>
                    <div className="w-8 h-8 rounded-full p-1 bg-white/5 shrink-0 flex items-center justify-center">
                      {featuredAwayCrest ? (
                        <img src={featuredAwayCrest} alt={featuredMatch.away_team} className="w-full h-full object-contain" />
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/50 border border-white/5 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-slate-400">Suma xG Combinado</span>
                    <span className="font-mono text-2xl font-black text-amber-400 tabular-nums">
                      {featuredTotalXg} <span className="text-xs font-normal text-slate-400">xG</span>
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 font-mono pt-2 border-t border-white/5">
                    <span>{featuredMatch.home_team}: <strong className="text-white">{featuredMatch.home_xg.toFixed(2)}</strong></span>
                    <span>{featuredMatch.away_team}: <strong className="text-white">{featuredMatch.away_xg.toFixed(2)}</strong></span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-slate-400">Análisis detallado tiro a tiro</span>
                <Link
                  href={`/matches?id=${featuredMatch.id}`}
                  className="font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                >
                  <span>Ver Match Intel</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Banner Estrella: Motor xG Interactivo */}
          <div className="mt-12 rounded-3xl p-8 relative overflow-hidden border border-white/10 bg-gradient-to-r from-slate-900/90 via-slate-950/90 to-slate-900/90 shadow-2xl backdrop-blur-xl">
            <div className={`absolute -right-16 -top-16 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none ${isUcl ? "bg-cyan-500" : "bg-emerald-500"}`} />
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                    isUcl ? "bg-cyan-500/10 border-cyan-400/30 text-cyan-300" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  }`}>
                    Suite Interactiva 100% Exclusiva
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Nuevo Motor xG 2026</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Simula disparos, duelos con 10.000 partidos y detecta espejismos
                </h3>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  Accede al <strong>Laboratorio de Tiro 3D</strong> con cálculo de ángulo trigonométrico y tiros gemelos reales, al <strong>Simulador Poisson de Duelos</strong> con matriz de calor 4x4 y al <strong>Detector de Espejismos & Regresión a la Media</strong>.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                <Link
                  href="/xg-engine"
                  className={`px-6 py-3.5 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 transition-all duration-300 hover:scale-105 ${
                    isUcl
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-cyan-500/25"
                      : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Explorar Motor xG</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* ─── Footer sutil ─────────────────────────────────────────────────── */}
      <footer className="py-6 border-t border-white/5 text-center text-xs text-slate-500">
        <PageContainer>
          <p>© 2026 xG Nexus · Plataforma de Analítica Avanzada & Telemetría de {meta.name}</p>
        </PageContainer>
      </footer>
    </div>
  );
}

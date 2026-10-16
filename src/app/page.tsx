"use client";

import Link from "next/link";
import Image from "next/image";
import equiposData from "@/data/equipos_xg.json";
import equiposUclData from "@/data/equipos_ucl_xg.json";
import matchesIndex from "../../public/data/matches/index.json";
import matchesUclIndex from "../../public/data/matches/ucl_index.json";
import { getTeamCrest, getTeamColor } from "@/utils/crests";
import PageContainer from "@/components/layout/PageContainer";
import HeroCanvas3D from "@/components/ui/HeroCanvas3D";
import { useCompetition } from "@/stores/filterStore";

export default function HomePage() {
  const { competition, meta } = useCompetition();

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

  return (
    <div className="relative min-h-[calc(100vh-64px)] flex flex-col justify-between overflow-hidden">
      {/* Luces de fondo ambientales */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-10 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* ─── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 border-b border-white/5">
        {/* Imagen de Raphinha con máscara de opacidad sutil y blend mode */}
        <div className="absolute inset-y-0 right-0 w-full md:w-3/5 pointer-events-none -z-10 overflow-hidden">
          <div className="relative w-full h-full">
            <Image
              src="/images/raphinha.jpg"
              alt="Raphinha LaLiga Action"
              fill
              priority
              className="object-cover object-top md:object-right-top opacity-20 md:opacity-25 mix-blend-luminosity brightness-90 contrast-125"
            />
            {/* Máscara de degradado radial y lineal hacia el fondo oscuro */}
            <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-bg/80 md:bg-gradient-to-r md:from-bg md:via-bg/70 md:to-transparent" />
          </div>
        </div>

        {/* Balón 3D geodésico interactivo en Canvas */}
        <div className="absolute inset-y-0 right-0 w-full md:w-1/2 pointer-events-none -z-10 overflow-hidden flex items-center justify-center opacity-65 mix-blend-screen">
          <HeroCanvas3D />
        </div>

        <PageContainer>
          <div className="max-w-2xl">
            {/* Pill de estado */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs text-slate-300 mb-6 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-emerald-400">xG Lab 2.0</span>
              <span className="text-slate-500">|</span>
              <span>Inteligencia Táctica & Expected Goals</span>
            </div>

            {/* Título Principal */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              El fútbol no se intuye.{" "}
              <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                Se cuantifica con xG.
              </span>
            </h1>

            {/* Subtítulo */}
            <p className="mt-6 text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl font-normal">
              Plataforma analítica de última generación para <strong className="text-white font-medium">{meta.name}</strong>. Modelos matemáticos de
              <strong className="text-white font-medium"> Expected Goals (xG)</strong>, mapas de tiro,
              presión <strong className="text-white font-medium">PPDA</strong> y métricas de eficiencia real de equipos y futbolistas.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/dashboard"
                className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35 transition-all duration-300 flex items-center gap-2 group hover:-translate-y-0.5"
              >
                <span>Explorar Command Center</span>
                <svg
                  className="w-4 h-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>

              <Link
                href="/matches"
                className="glass-card px-6 py-3.5 rounded-xl text-white font-semibold text-sm hover:bg-white/[0.08] transition-all duration-300 flex items-center gap-2 hover:-translate-y-0.5"
              >
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Analizar Match Intel</span>
              </Link>
            </div>

            {/* Métricas destacadas en píldoras */}
            <div className="mt-10 pt-6 border-t border-white/10 flex flex-wrap items-center gap-6 sm:gap-10 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-white font-bold text-sm">{currentEquipos.length}</span> Equipos monitorizados
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span className="text-white font-bold text-sm">ShotMap</span> Probabilidad tiro a tiro
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="text-white font-bold text-sm">100%</span> Métricas Understat & Reales
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

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
        </PageContainer>
      </section>

      {/* ─── Footer sutil ─────────────────────────────────────────────────── */}
      <footer className="py-6 border-t border-white/5 text-center text-xs text-slate-500">
        <PageContainer>
          <p>© 2026 xG Lab · Plataforma de Analítica Avanzada de {meta.name}</p>
        </PageContainer>
      </footer>
    </div>
  );
}

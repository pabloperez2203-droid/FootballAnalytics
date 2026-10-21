"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useCompetition } from "@/stores/filterStore";
import { getTeamCrest, getTeamColor } from "@/utils/crests";

interface RealShot {
  id: string;
  min: number;
  player: string;
  team: string;
  teamName: string;
  xg: number;
  result: string;
  xMeters: number;
  yMeters: number;
  distMeters: number;
}

export default function ShotLabSimulator() {
  const { competition, isUcl } = useCompetition();

  // Coordenadas del balón en metros (medio campo: ancho 68m, fondo 52.5m)
  // Portería centrada en x=34, y=0. Centro del campo en y=52.5
  const [ball, setBall] = useState({ x: 34, y: 16.5 });
  const [is3D, setIs3D] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Parámetros contextuales del disparo
  const [bodyPart, setBodyPart] = useState<"pie" | "cabeza" | "volea">("pie");
  const [situation, setSituation] = useState<
    "abierta" | "contra" | "corner" | "falta" | "mano_a_mano"
  >("abierta");
  const [assist, setAssist] = useState<
    "hueco" | "centro" | "regate" | "rebote"
  >("hueco");

  // Almacén de tiros reales de la temporada
  const [seasonShots, setSeasonShots] = useState<RealShot[]>([]);
  const [loadingShots, setLoadingShots] = useState(true);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Dimensiones del campo (metros y SVG)
  // Ancho: 68m -> 680 SVG units (1m = 10 units)
  // Fondo medio campo: 52.5m -> 525 SVG units
  // Margen superior para ver la portería completa: 40 units
  const GOAL_Y = 40;
  const PITCH_WIDTH = 680;
  const PITCH_HEIGHT = 525;
  const POST_LEFT_X = 303.4; // 34 - 3.66m * 10
  const POST_RIGHT_X = 376.6; // 34 + 3.66m * 10
  const GOAL_CENTER_X = 340;

  // Carga de partidos reales para el buscador de tiros gemelos
  useEffect(() => {
    let isMounted = true;
    setLoadingShots(true);

    const indexUrl = isUcl
      ? "/data/matches/ucl_index.json"
      : "/data/matches/index.json";

    fetch(indexUrl)
      .then((res) => res.json())
      .then(async (matches: any[]) => {
        if (!isMounted || !matches || !matches.length) {
          setLoadingShots(false);
          return;
        }

        // Cargamos los últimos 20 partidos disputados para tener un catálogo rico de tiros reales
        const playedMatches = matches.filter((m: any) => m.status !== 'scheduled');
        const recentMatches = (playedMatches.length > 0 ? playedMatches : matches).slice(-20);
        const shotPromises = recentMatches.map((m) =>
          fetch(`/data/matches/${m.id}.json`)
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null)
        );

        const matchResults = await Promise.all(shotPromises);
        if (!isMounted) return;

        const collectedShots: RealShot[] = [];

        matchResults.forEach((md) => {
          if (!md || !md.shots) return;
          const homeTeam = md.match?.home_team || "Local";
          const awayTeam = md.match?.away_team || "Visitante";

          md.shots.forEach((s: any) => {
            // En Understat, x e y van de 0 a 100.
            // Los tiros de ataque a portería están normalizados:
            // x: distancia a portería propia (100 = línea de gol rival)
            // y: ancho (50 = centro)
            const rawX = Number(s.x) || 50;
            const rawY = Number(s.y) || 50;

            // Convertimos a metros relativos a nuestra portería objetivo
            // yMeters: distancia desde línea de gol hacia el centro (100 -> 0m, 50 -> 52.5m)
            const distFromGoalPercent = Math.max(0, 100 - rawX);
            const yMeters = (distFromGoalPercent / 50) * 52.5;

            // xMeters: de 0 a 68m (50% -> 34m)
            const xMeters = (rawY / 100) * 68;

            const tName = s.team === "home" ? homeTeam : awayTeam;

            collectedShots.push({
              id: String(s.id),
              min: Number(s.min) || 0,
              player: s.player || "Desconocido",
              team: s.team || "home",
              teamName: tName,
              xg: Number(s.xg) || 0.05,
              result: s.result || "Disparo",
              xMeters,
              yMeters,
              distMeters: 0,
            });
          });
        });

        setSeasonShots(collectedShots);
        setLoadingShots(false);
      })
      .catch(() => {
        if (isMounted) setLoadingShots(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isUcl]);

  // Cálculo geométrico de distancia y ángulo de apertura (en metros y grados)
  const metrics = useMemo(() => {
    const dx = ball.x - 34;
    const dy = ball.y;
    const distanceMeters = Math.hypot(dx, dy);

    // Vector al poste izquierdo y derecho (postes en y=0, x=30.34 y 37.66)
    const v1x = 30.34 - ball.x;
    const v1y = 0 - ball.y;
    const v2x = 37.66 - ball.x;
    const v2y = 0 - ball.y;

    const dot = v1x * v2x + v1y * v2y;
    const len1 = Math.hypot(v1x, v1y);
    const len2 = Math.hypot(v2x, v2y);

    let angleDeg = 0;
    if (len1 > 0.001 && len2 > 0.001) {
      const cosA = Math.max(-1, Math.min(1, dot / (len1 * len2)));
      angleDeg = Math.acos(cosA) * (180 / Math.PI);
    }

    // Modelo Logístico de xG Profesional
    let logit = -0.45;
    logit += -0.118 * distanceMeters;
    logit += 0.039 * angleDeg;
    logit += -0.00065 * distanceMeters * angleDeg;

    // Modificadores de contexto anatómico y táctico
    if (bodyPart === "pie") logit += 0.18;
    else if (bodyPart === "cabeza") logit += -0.52;
    else if (bodyPart === "volea") logit += -0.12;

    if (situation === "abierta") logit += 0.0;
    else if (situation === "contra") logit += 0.48;
    else if (situation === "corner") logit += -0.28;
    else if (situation === "falta") logit += -0.38;
    else if (situation === "mano_a_mano") logit += 1.05;

    if (assist === "hueco") logit += 0.38;
    else if (assist === "centro") logit += -0.16;
    else if (assist === "regate") logit += 0.12;
    else if (assist === "rebote") logit += 0.28;

    const rawProb = 1 / (1 + Math.exp(-logit));
    const xg = Math.min(0.98, Math.max(0.01, rawProb));

    // Tiro alternativo asistiendo al área pequeña (x=34, y=4) con el pie
    const passDist = 4.2;
    const passAngle = 75;
    const passLogit =
      -0.45 - 0.118 * passDist + 0.039 * passAngle + 0.18 + 0.38;
    const passXg = Math.min(0.95, 1 / (1 + Math.exp(-passLogit)));

    return {
      distanceMeters,
      angleDeg,
      xg,
      passXg,
      diffPass: Math.max(0, passXg - xg),
    };
  }, [ball, bodyPart, situation, assist]);

  // Buscador de Tiros Gemelos Reales dentro de un radio de 4.8 metros
  const twinShots = useMemo(() => {
    if (!seasonShots.length) return { count: 0, goals: 0, closest: [] };

    const radius = 4.8;
    const near = seasonShots
      .map((s) => {
        const d = Math.hypot(s.xMeters - ball.x, s.yMeters - ball.y);
        return { ...s, distMeters: d };
      })
      .filter((s) => s.distMeters <= radius)
      .sort((a, b) => a.distMeters - b.distMeters);

    const goals = near.filter(
      (s) =>
        s.result.toLowerCase().includes("gol") ||
        s.result.toLowerCase().includes("goal")
    ).length;

    return {
      count: near.length,
      goals,
      closest: near.slice(0, 3),
    };
  }, [ball, seasonShots]);

  // Conversión precisa de coordenadas (ratón y táctil móvil) a metros
  const updateBallPosition = (clientX: number, clientY: number) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    // Normalizamos a unidades SVG
    const svgX = (clickX / rect.width) * PITCH_WIDTH;
    const svgY = (clickY / rect.height) * (PITCH_HEIGHT + GOAL_Y);

    // Mapeamos a metros dentro del campo
    const clampedY = Math.max(1, Math.min(50, (svgY - GOAL_Y) / 10));
    const clampedX = Math.max(2, Math.min(66, svgX / 10));

    setBall({
      x: Math.round(clampedX * 10) / 10,
      y: Math.round(clampedY * 10) / 10,
    });
  };

  const handlePointerAction = (e: React.PointerEvent<SVGSVGElement>) => {
    updateBallPosition(e.clientX, e.clientY);
  };

  const handleTouchAction = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches && e.touches[0]) {
      updateBallPosition(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  // Coordenadas SVG del balón
  const ballSvgX = ball.x * 10;
  const ballSvgY = GOAL_Y + ball.y * 10;

  // Frase intuitiva de xG
  const shotsNeeded = Math.max(1, Math.round(1 / metrics.xg));

  return (
    <div className="glass-card interactive-card rounded-2xl p-6 sm:p-8 flex flex-col gap-8 transition-all duration-300">
      {/* ─── Encabezado del Módulo ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full animate-pulse shadow-md ${
                isUcl ? "bg-cyan-400 shadow-cyan-400/50" : "bg-emerald-400 shadow-emerald-400/50"
              }`}
            />
            <span
              className={`text-xs font-mono font-bold tracking-wider uppercase ${
                isUcl ? "text-cyan-400" : "text-emerald-400"
              }`}
            >
              MÓDULO 1 · FÍSICA Y GEOMETRÍA DEL GOL
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Laboratorio de Tiro Interactivo
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Haz clic o arrastra el balón por el campo para simular el cono de visión a portería, calcular el xG en tiempo real y localizar disparos gemelos reales de la temporada.
          </p>
        </div>

        {/* Botón de Inclinación 3D */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setIs3D(!is3D)}
            className={`px-3.5 py-2 min-h-[42px] sm:min-h-[36px] rounded-xl text-xs font-mono font-bold border transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-sm touch-manipulation active:scale-95 ${
              is3D
                ? isUcl
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-400/50 shadow-[0_0_15px_rgba(56,189,248,0.3)]"
                  : "bg-emerald-500/20 text-emerald-300 border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                : "bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/[0.08]"
            }`}
          >
            <svg
              className={`w-4 h-4 transition-transform duration-300 ${is3D ? "rotate-45" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            <span>{is3D ? "Perspectiva TV 3D Activa" : "Activar Vista 3D"}</span>
          </button>
        </div>
      </div>

      {/* ─── Contenedor Central: Campo SVG + Telemetría xG ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Medio Campo SVG Interactivo */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div
            className={`relative w-full max-w-lg transition-transform duration-700 ease-out select-none ${
              is3D ? "[transform:perspective(900px)_rotateX(28deg)_scale(0.96)]" : ""
            }`}
          >
            {/* Contenedor SVG del medio campo */}
            <div className="p-3 sm:p-5 rounded-2xl bg-slate-950/80 border border-white/10 shadow-2xl relative overflow-hidden">
              {/* Iluminación ambiental del césped */}
              <div
                className={`absolute inset-0 opacity-15 pointer-events-none transition-colors duration-700 ${
                  isUcl
                    ? "bg-gradient-to-b from-cyan-600/30 via-transparent to-blue-900/40"
                    : "bg-gradient-to-b from-emerald-600/30 via-transparent to-teal-900/40"
                }`}
              />

              <svg
                ref={svgRef}
                viewBox={`0 0 ${PITCH_WIDTH} ${PITCH_HEIGHT + GOAL_Y}`}
                className="w-full h-auto cursor-crosshair overflow-visible touch-none select-none"
                onPointerDown={(e) => {
                  setIsDragging(true);
                  try {
                    e.currentTarget.setPointerCapture(e.pointerId);
                  } catch {}
                  handlePointerAction(e);
                }}
                onPointerMove={(e) => {
                  if (isDragging) handlePointerAction(e);
                }}
                onPointerUp={(e) => {
                  setIsDragging(false);
                  try {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                  } catch {}
                }}
                onPointerCancel={() => setIsDragging(false)}
                onTouchStart={(e) => {
                  setIsDragging(true);
                  handleTouchAction(e);
                }}
                onTouchMove={(e) => {
                  if (isDragging) {
                    handleTouchAction(e);
                  }
                }}
                onTouchEnd={() => setIsDragging(false)}
              >
                <defs>
                  {/* Gradiente del Cono de Visión */}
                  <linearGradient id="visionConeGrad" x1="0" y1="1" x2="0" y2="0">
                    <stop
                      offset="0%"
                      stopColor={isUcl ? "#38bdf8" : "#10b981"}
                      stopOpacity="0.45"
                    />
                    <stop
                      offset="100%"
                      stopColor={isUcl ? "#0284c7" : "#059669"}
                      stopOpacity="0.10"
                    />
                  </linearGradient>

                  {/* Filtro Glow para el Balón */}
                  <filter id="ballGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* 1. Marco del Campo */}
                <rect
                  x="0"
                  y={GOAL_Y}
                  width={PITCH_WIDTH}
                  height={PITCH_HEIGHT}
                  fill="#061214"
                  stroke="#1e2c33"
                  strokeWidth="2.5"
                />

                {/* Franjas del césped */}
                {[0, 1, 2, 3, 4, 5, 6].map((idx) => (
                  <rect
                    key={idx}
                    x="0"
                    y={GOAL_Y + idx * 75}
                    width={PITCH_WIDTH}
                    height="37.5"
                    fill="white"
                    fillOpacity="0.015"
                  />
                ))}

                {/* 2. Red y Portería (7.32m = 73.2 SVG units) */}
                <rect
                  x={POST_LEFT_X}
                  y={GOAL_Y - 20}
                  width={73.2}
                  height="20"
                  fill="rgba(255, 255, 255, 0.04)"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                />
                {/* Postes */}
                <circle cx={POST_LEFT_X} cy={GOAL_Y} r="3.5" fill="#ffffff" />
                <circle cx={POST_RIGHT_X} cy={GOAL_Y} r="3.5" fill="#ffffff" />

                {/* 3. Área Pequeña (5.5m = 55 units, 18.32m = 183.2 units) */}
                <rect
                  x={340 - 91.6}
                  y={GOAL_Y}
                  width={183.2}
                  height="55"
                  fill="none"
                  stroke="#293942"
                  strokeWidth="2"
                />

                {/* 4. Área Grande (16.5m = 165 units, 40.32m = 403.2 units) */}
                <rect
                  x={340 - 201.6}
                  y={GOAL_Y}
                  width={403.2}
                  height="165"
                  fill="none"
                  stroke="#293942"
                  strokeWidth="2"
                />

                {/* Punto de penalti (11m = 110 units) */}
                <circle cx="340" cy={GOAL_Y + 110} r="3" fill="#38bdf8" fillOpacity="0.8" />

                {/* Arco del área de penalti (R = 91.5 units) */}
                <path
                  d={`M ${340 - 73} ${GOAL_Y + 165} A 91.5 91.5 0 0 0 ${340 + 73} ${GOAL_Y + 165}`}
                  fill="none"
                  stroke="#293942"
                  strokeWidth="2"
                />

                {/* Línea del medio campo */}
                <line
                  x1="0"
                  y1={GOAL_Y + PITCH_HEIGHT}
                  x2={PITCH_WIDTH}
                  y2={GOAL_Y + PITCH_HEIGHT}
                  stroke="#293942"
                  strokeWidth="2"
                />
                {/* Círculo central (R = 91.5 units) */}
                <path
                  d={`M ${340 - 91.5} ${GOAL_Y + PITCH_HEIGHT} A 91.5 91.5 0 0 1 ${340 + 91.5} ${GOAL_Y + PITCH_HEIGHT}`}
                  fill="none"
                  stroke="#293942"
                  strokeWidth="2"
                />

                {/* ─── TRIÁNGULO / CONO DE VISIÓN A PORTERÍA ─── */}
                <polygon
                  points={`${ballSvgX},${ballSvgY} ${POST_LEFT_X},${GOAL_Y} ${POST_RIGHT_X},${GOAL_Y}`}
                  fill="url(#visionConeGrad)"
                  stroke={isUcl ? "#38bdf8" : "#10b981"}
                  strokeWidth="1.8"
                  strokeDasharray="4 4"
                  className="transition-all duration-75"
                />

                {/* Línea central de distancia al gol */}
                <line
                  x1={ballSvgX}
                  y1={ballSvgY}
                  x2={GOAL_CENTER_X}
                  y2={GOAL_Y}
                  stroke="rgba(255, 255, 255, 0.35)"
                  strokeWidth="1.2"
                  strokeDasharray="2 3"
                />

                {/* Tiros reales cercanos mostrados como puntos fantasma */}
                {twinShots.closest.map((ts, idx) => {
                  const tsSvgX = ts.xMeters * 10;
                  const tsSvgY = GOAL_Y + ts.yMeters * 10;
                  const isGoal =
                    ts.result.toLowerCase().includes("gol") ||
                    ts.result.toLowerCase().includes("goal");

                  return (
                    <g key={idx} className="opacity-80">
                      <circle
                        cx={tsSvgX}
                        cy={tsSvgY}
                        r="5"
                        fill={isGoal ? "#fbbf24" : "rgba(255,255,255,0.4)"}
                        stroke="#000000"
                        strokeWidth="1.5"
                      />
                    </g>
                  );
                })}

                {/* ─── EL BALÓN INTERACTIVO ─── */}
                <g className="cursor-grab active:cursor-grabbing">
                  {/* Sombra de apoyo estática */}
                  <circle
                    cx={ballSvgX}
                    cy={ballSvgY + 2}
                    r="11"
                    fill="rgba(0,0,0,0.4)"
                  />
                  {/* Borde exterior del balón */}
                  <circle
                    cx={ballSvgX}
                    cy={ballSvgY}
                    r="10"
                    fill={isUcl ? "#0284c7" : "#059669"}
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    filter="url(#ballGlow)"
                  />
                  {/* Núcleo blanco brillante */}
                  <circle cx={ballSvgX} cy={ballSvgY} r="4.5" fill="#ffffff" />
                </g>

                {/* Etiqueta flotante con Distancia y Ángulo */}
                <g transform={`translate(${Math.min(520, Math.max(120, ballSvgX))}, ${Math.min(510, ballSvgY + 28)})`}>
                  <rect
                    x="-65"
                    y="-16"
                    width="130"
                    height="24"
                    rx="12"
                    fill="#050811"
                    fillOpacity="0.92"
                    stroke={isUcl ? "#38bdf8" : "#10b981"}
                    strokeWidth="1.5"
                  />
                  <text
                    x="0"
                    y="0"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="700"
                    fontFamily="monospace"
                  >
                    {metrics.distanceMeters.toFixed(1)}m · {metrics.angleDeg.toFixed(0)}°
                  </text>
                </g>
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mt-3">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Haz clic o arrastra para recolocar el punto de remate</span>
          </div>
        </div>

        {/* Columna Derecha: Velocímetro de xG + Contexto + Tiros Gemelos */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* ── 1. Tacómetro / Velocímetro de xG ── */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                Probabilidad Calculada
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight tabular-nums">
                  {metrics.xg.toFixed(2)}
                </span>
                <span className="text-sm font-mono text-emerald-400 font-bold">
                  xG ({Math.round(metrics.xg * 100)}%)
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1.5 font-medium leading-relaxed">
                Necesitas ~<strong className="text-amber-400">{shotsNeeded}</strong> tiros iguales para marcar 1 gol.
              </p>
            </div>

            {/* Medidor Circular */}
            <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`transition-all duration-300 ${
                    metrics.xg > 0.4
                      ? "text-emerald-400 drop-shadow-[0_0_8px_#10b981]"
                      : metrics.xg > 0.15
                      ? "text-amber-400 drop-shadow-[0_0_8px_#f59e0b]"
                      : "text-cyan-400 drop-shadow-[0_0_8px_#38bdf8]"
                  }`}
                  strokeDasharray={`${metrics.xg * 100}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-mono font-bold text-white">
                  {(metrics.xg * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {/* ── 2. Selectores de Contexto de Tiro (Pills) ── */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3.5">
            {/* Parte del cuerpo */}
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400 font-bold mb-1.5">
                1. Parte del cuerpo
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(["pie", "cabeza", "volea"] as const).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBodyPart(b)}
                    className={`min-h-[44px] sm:min-h-[36px] py-1.5 px-2 rounded-xl text-xs font-mono font-semibold capitalize border transition-all cursor-pointer flex items-center justify-center touch-manipulation active:scale-[0.98] ${
                      bodyPart === b
                        ? isUcl
                          ? "bg-cyan-500/25 text-cyan-200 border-cyan-400/60 shadow-[0_0_12px_rgba(56,189,248,0.2)] font-bold"
                          : "bg-emerald-500/25 text-emerald-200 border-emerald-400/60 shadow-[0_0_12px_rgba(16,185,129,0.2)] font-bold"
                        : "bg-white/[0.04] text-slate-400 border-white/5 hover:text-white"
                    }`}
                  >
                    {b === "volea" ? "Volea / Otro" : b}
                  </button>
                ))}
              </div>
            </div>

            {/* Situación de juego */}
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400 font-bold mb-1.5">
                2. Situación de juego
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {(
                  [
                    { id: "abierta", label: "Jugada Abierta" },
                    { id: "contra", label: "Contraataque" },
                    { id: "corner", label: "Córner" },
                    { id: "falta", label: "Falta Directa" },
                    { id: "mano_a_mano", label: "Mano a Mano" },
                  ] as const
                ).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSituation(s.id)}
                    className={`min-h-[44px] sm:min-h-[36px] py-1.5 px-2 rounded-xl text-xs font-mono font-semibold border transition-all cursor-pointer truncate flex items-center justify-center touch-manipulation active:scale-[0.98] ${
                      situation === s.id
                        ? isUcl
                          ? "bg-cyan-500/25 text-cyan-200 border-cyan-400/60 shadow-[0_0_12px_rgba(56,189,248,0.2)] font-bold"
                          : "bg-emerald-500/25 text-emerald-200 border-emerald-400/60 shadow-[0_0_12px_rgba(16,185,129,0.2)] font-bold"
                        : "bg-white/[0.04] text-slate-400 border-white/5 hover:text-white"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tipo de asistencia previa */}
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-400 font-bold mb-1.5">
                3. Asistencia previa
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { id: "hueco", label: "Pase al hueco" },
                    { id: "centro", label: "Centro lateral" },
                    { id: "regate", label: "Regate individual" },
                    { id: "rebote", label: "Rebote suelto" },
                  ] as const
                ).map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAssist(a.id)}
                    className={`min-h-[44px] sm:min-h-[36px] py-1.5 px-2 rounded-xl text-xs font-mono font-semibold border transition-all cursor-pointer truncate flex items-center justify-center touch-manipulation active:scale-[0.98] ${
                      assist === a.id
                        ? isUcl
                          ? "bg-cyan-500/25 text-cyan-200 border-cyan-400/60 shadow-[0_0_12px_rgba(56,189,248,0.2)] font-bold"
                          : "bg-emerald-500/25 text-emerald-200 border-emerald-400/60 shadow-[0_0_12px_rgba(16,185,129,0.2)] font-bold"
                        : "bg-white/[0.04] text-slate-400 border-white/5 hover:text-white"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── 3. Comparativa "¿Tirar o Pasar?" ── */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-bold font-mono uppercase">
              <span className="text-base">⚡</span>
              <span>Análisis Táctico: ¿Tirar o Pasar?</span>
            </div>
            <p className="mt-1.5 text-slate-300 leading-relaxed">
              {metrics.xg >= 0.45 ? (
                <>
                  <strong className="text-emerald-400">Zona de Máxima Letalidad</strong>. El modelo aconseja <strong className="text-white">REMATAR</strong> directamente ya que tu posición actual supera el umbral de disparo óptimo.
                </>
              ) : (
                <>
                  Un pase extra al corazón del área pequeña elevaría el xG hasta{" "}
                  <strong className="text-white">{metrics.passXg.toFixed(2)}</strong>{" "}
                  (<strong className="text-amber-400">+{Math.round(metrics.diffPass * 100)}% de probabilidad</strong>).
                </>
              )}
            </p>
          </div>

          {/* ── 4. Tiros Gemelos Reales de la Temporada ── */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center justify-between mb-2.5">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>🎯</span>
                <span>Tiros Gemelos Reales ({isUcl ? "Champions" : "LaLiga"})</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-400">
                Radio: 4.8m
              </span>
            </div>

            {loadingShots ? (
              <div className="py-4 text-center text-xs text-slate-500 font-mono animate-pulse">
                Cargando disparos reales de la temporada...
              </div>
            ) : twinShots.count === 0 ? (
              <p className="text-xs text-slate-400 py-2">
                No hay tiros registrados exactamente desde esta zona en los partidos indexados. Prueba a arrastrar el balón más cerca del área.
              </p>
            ) : (
              <div>
                <div className="text-xs text-slate-300 mb-3 flex items-center gap-3">
                  <span>
                    Disparos registrados: <strong className="text-white font-mono">{twinShots.count}</strong>
                  </span>
                  <span>·</span>
                  <span>
                    Goles reales: <strong className="text-amber-400 font-mono">{twinShots.goals}</strong> (
                    {Math.round((twinShots.goals / twinShots.count) * 100)}% efectividad)
                  </span>
                </div>

                <div className="space-y-2">
                  {twinShots.closest.map((shot, idx) => {
                    const isGoal =
                      shot.result.toLowerCase().includes("gol") ||
                      shot.result.toLowerCase().includes("goal");
                    const crest = getTeamCrest(shot.teamName);

                    return (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs hover:border-white/20 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          {crest && (
                            <img
                              src={crest}
                              alt={shot.teamName}
                              className="w-5 h-5 object-contain"
                            />
                          )}
                          <div>
                            <div className="font-semibold text-white">
                              {shot.player}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {shot.teamName} · Min {shot.min}&apos;
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              isGoal
                                ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                                : "bg-slate-800 text-slate-300"
                            }`}
                          >
                            {shot.result}
                          </span>
                          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                            {shot.xg.toFixed(2)} xG
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import React, { useState, useEffect, useRef } from 'react';
import { getMatchTeamColors, getTeamCrest } from '@/utils/crests';

interface ShotMapProps {
  shots: any[];
  matchData?: any;
  hoveredShotId?: string | number | null;
  onHoverShot?: (id: string | number | null) => void;
  homeColor?: string;
  awayColor?: string;
}

export default function ShotMap({
  shots,
  matchData,
  hoveredShotId,
  onHoverShot,
  homeColor,
  awayColor
}: ShotMapProps) {
  const [filter, setFilter] = useState('Ambos');
  const [subFilter, setSubFilter] = useState<string>('');
  const [hoverId, setHoverId] = useState<string | null>(null);

  // Estados para la simulación cronológica del partido
  const [isPlaying, setIsPlaying] = useState(false);
  const [playMinute, setPlayMinute] = useState<number | null>(null);
  const [goalFlash, setGoalFlash] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const [celebratingGoal, setCelebratingGoal] = useState<any | null>(null);

  // Almacén de fotos de jugadores
  const [photos, setPhotos] = useState<Record<string, any>>({});

  const speedRef = useRef(speed);
  speedRef.current = speed;

  const isPausedForGoalRef = useRef(false);
  const minuteAccumulatorRef = useRef(1);
  const celebratedGoalIdsRef = useRef<Set<string>>(new Set());

  // Carga de fotos de jugadores
  useEffect(() => {
    fetch('/data/player_photos.json')
      .then(res => res.json())
      .then(data => setPhotos(data))
      .catch(() => {
        fetch('/data/players_photos.json')
          .then(res => res.json())
          .then(data => setPhotos(data))
          .catch(() => {});
      });
  }, []);

  const getPlayerPhoto = (shot: any) => {
    if (!shot) return undefined;
    const teamName = shot.team === 'home' ? matchData?.home_team : matchData?.away_team;
    return (
      shot.photo ||
      photos[`${teamName}|${shot.player}`] ||
      photos[shot.player] ||
      (photos._by_id && shot.player_id && photos._by_id[shot.player_id]?.url) ||
      (photos[shot.player_id]?.ruta_local || photos[shot.player_id]?.url)
    );
  };

  const colors = (homeColor && awayColor)
    ? { homeColor, awayColor }
    : getMatchTeamColors(matchData?.home_team, matchData?.away_team);
  const resolvedHomeColor = colors.homeColor;
  const resolvedAwayColor = colors.awayColor;

  const filters = ['Ambos', 'Equipo', 'Jugador'];

  // Minuto máximo del partido
  const maxMinute = Math.max(90, ...shots.map(s => Number(s.min ?? s.minute) || 0));

  // Reanudar la simulación tras el pop-up de gol
  const resumeFromGoal = () => {
    setCelebratingGoal(null);
    isPausedForGoalRef.current = false;
    setGoalFlash(false);
  };

  // Temporizador automático de 2.5s para reanudar tras la celebración
  useEffect(() => {
    if (!celebratingGoal) return;
    const timer = setTimeout(() => {
      resumeFromGoal();
    }, 2500);
    return () => clearTimeout(timer);
  }, [celebratingGoal]);

  // Alternar reproducción
  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      setPlayMinute(null);
      setGoalFlash(false);
      setCelebratingGoal(null);
      isPausedForGoalRef.current = false;
    } else {
      celebratedGoalIdsRef.current.clear();
      minuteAccumulatorRef.current = 1;
      setPlayMinute(1);
      setCelebratingGoal(null);
      isPausedForGoalRef.current = false;
      setIsPlaying(true);
    }
  };

  // Animación del partido con factor de velocidad y pausa en goles
  useEffect(() => {
    if (!isPlaying) {
      setPlayMinute(null);
      setGoalFlash(false);
      setCelebratingGoal(null);
      isPausedForGoalRef.current = false;
      return;
    }

    let lastTime = performance.now();
    let rafId: number;
    const BASE_DURATION = 4000; // 4s a 1x

    const tick = (now: number) => {
      const deltaMs = now - lastTime;
      lastTime = now;

      // Si está en pausa por celebración de gol, esperar sin avanzar el minuto
      if (isPausedForGoalRef.current) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      const minuteRate = (maxMinute - 1) / (BASE_DURATION / speedRef.current);
      minuteAccumulatorRef.current = Math.min(maxMinute, minuteAccumulatorRef.current + minuteRate * deltaMs);
      const currentMin = Math.max(1, Math.floor(minuteAccumulatorRef.current));
      setPlayMinute(currentMin);

      // Detectar si ocurrió algún gol hasta el minuto actual no celebrado aún
      const newGoal = shots.find(s => {
        const isG = s.result === 'Gol' || s.result === 'Goal';
        const m = Number(s.min ?? s.minute) || 0;
        const goalKey = String(s.id ?? `${m}-${s.player}`);
        return isG && m <= currentMin && !celebratedGoalIdsRef.current.has(goalKey);
      });

      if (newGoal) {
        const goalKey = String(newGoal.id ?? `${newGoal.min ?? newGoal.minute}-${newGoal.player}`);
        celebratedGoalIdsRef.current.add(goalKey);
        setGoalFlash(true);
        setCelebratingGoal(newGoal);
        isPausedForGoalRef.current = true;
        rafId = requestAnimationFrame(tick);
        return;
      }

      if (minuteAccumulatorRef.current >= maxMinute) {
        // Al terminar el partido
        setTimeout(() => {
          setIsPlaying(false);
          setPlayMinute(null);
          setGoalFlash(false);
          setCelebratingGoal(null);
          isPausedForGoalRef.current = false;
        }, 700);
        return;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, maxMinute, shots]);

  useEffect(() => {
    if (filter === 'Equipo') {
      setSubFilter('home');
    } else if (filter === 'Jugador') {
      const players = Array.from(new Set(shots.map(s => s.player))).sort();
      setSubFilter(players[0] || '');
    } else {
      setSubFilter('');
    }
  }, [filter, shots]);

  // Map 0-100 to SVG coords 0-600 (width) and 0-400 (height)
  const getX = (x: number) => (x / 100) * 600;
  const getY = (y: number) => (y / 100) * 400;

  const visibleShots = shots.filter(s => {
    // Si está en reproducción activa, mostrar solo los tiros hasta el minuto actual
    if (isPlaying && playMinute !== null) {
      const shotMin = Number(s.min ?? s.minute) || 0;
      if (shotMin > playMinute) return false;
    }
    if (filter === 'Ambos') return true;
    if (filter === 'Equipo') return s.team === subFilter;
    if (filter === 'Jugador') return s.player === subFilter;
    return true;
  });

  const goalTeamName = celebratingGoal
    ? celebratingGoal.team === 'home'
      ? matchData?.home_team
      : matchData?.away_team
    : '';
  const goalTeamColor = celebratingGoal
    ? celebratingGoal.team === 'home'
      ? resolvedHomeColor
      : resolvedAwayColor
    : '#f59e0b';
  const goalTeamCrest = goalTeamName ? getTeamCrest(goalTeamName) : undefined;
  const goalPhoto = celebratingGoal ? getPlayerPhoto(celebratingGoal) : undefined;

  return (
    <div className="glass-card rounded-2xl p-6 h-full flex flex-col transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
         <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="lbl font-semibold">Mapa de tiros</div>
              {matchData && (
                <div className="flex items-center gap-3 text-xs font-medium text-slate-400 font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: resolvedHomeColor }}></span>
                    <span className="text-white font-semibold">{matchData.home_team}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: resolvedAwayColor }}></span>
                    <span className="text-white font-semibold">{matchData.away_team}</span>
                  </div>
                </div>
              )}
            </div>
            {/* Sub-filters based on main filter */}
            {filter === 'Equipo' && (
              <div className="inline-flex gap-1 bg-white/[0.04] p-1 rounded-lg border border-white/10">
                <button
                  type="button"
                  onClick={() => setSubFilter('home')}
                  style={subFilter === 'home' ? { backgroundColor: `${resolvedHomeColor}33`, color: resolvedHomeColor, borderColor: `${resolvedHomeColor}66` } : undefined}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md border border-transparent transition-all cursor-pointer touch-manipulation active:scale-95 ${subFilter === 'home' ? 'font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Local
                </button>
                <button
                  type="button"
                  onClick={() => setSubFilter('away')}
                  style={subFilter === 'away' ? { backgroundColor: `${resolvedAwayColor}33`, color: resolvedAwayColor, borderColor: `${resolvedAwayColor}66` } : undefined}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md border border-transparent transition-all cursor-pointer touch-manipulation active:scale-95 ${subFilter === 'away' ? 'font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Visitante
                </button>
              </div>
            )}
            {filter === 'Jugador' && (
              <select value={subFilter} onChange={e => setSubFilter(e.target.value)} className="bg-slate-900 text-xs p-1.5 rounded-lg text-slate-300 border border-white/10 outline-none focus:border-slate-500 w-fit cursor-pointer">
                {Array.from(new Set(shots.map(s => s.player))).sort().map(p => (
                  <option key={p as string} value={p as string}>{p as string}</option>
                ))}
              </select>
            )}
         </div>

         <div className="flex flex-wrap items-center gap-2">
            {/* Botón Simular Cronología (Play/Pause) */}
            <button
               type="button"
               onClick={togglePlay}
               className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all duration-300 border shadow-sm cursor-pointer touch-manipulation active:scale-95 min-h-[36px] ${
                 isPlaying
                   ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 shadow-rose-500/20'
                   : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25 hover:shadow-emerald-500/20'
               }`}
               title={isPlaying ? 'Detener simulación' : "Reproducir cronología de tiros (1' a 90+')"}
            >
               {isPlaying ? (
                 <>
                   <span className="w-2 h-2 rounded-sm bg-rose-400 animate-pulse" />
                   <span>⏹ Detener</span>
                 </>
               ) : (
                 <>
                   <span className="text-[10px]">▶</span>
                   <span>Reproducir Partido</span>
                 </>
               )}
            </button>

            {/* Selector de Velocidad de Reproducción */}
            <div className="inline-flex bg-white/[0.04] p-0.5 rounded-lg border border-white/10 items-center">
              {[0.5, 1, 2, 4].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-1 text-xs font-mono font-semibold rounded transition-all cursor-pointer touch-manipulation active:scale-95 min-h-[32px] ${
                    speed === s
                      ? 'bg-emerald-500/25 text-emerald-400 border border-emerald-500/35 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
                      : 'text-slate-400 hover:text-white border border-transparent'
                  }`}
                  title={`Velocidad de reproducción ${s}x`}
                >
                  {s}x
                </button>
              ))}
            </div>

            <div className="flex gap-1 bg-white/[0.04] p-1 rounded-lg border border-white/10 overflow-x-auto no-scrollbar">
               {filters.map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer touch-manipulation active:scale-95 min-h-[32px] whitespace-nowrap ${
                      filter === f ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                     {f}
                  </button>
               ))}
            </div>
         </div>
      </div>

      <div className="flex-1 relative w-full flex items-center justify-center bg-[#0d1114]/90 rounded-xl border border-white/10 overflow-hidden p-2">
         {/* Pop-up / Overlay de Celebración de Gol (Estilo EA Sports FC / TV Broadcast) */}
         {celebratingGoal && (
            <div className="absolute inset-0 z-30 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
              <div className="relative w-full max-w-xs sm:max-w-sm rounded-3xl p-5 sm:p-6 bg-gradient-to-b from-slate-900/95 via-slate-950/98 to-slate-900/95 border-2 border-amber-400/50 shadow-[0_0_50px_rgba(245,158,11,0.35)] flex flex-col items-center text-center overflow-hidden animate-scale-in">
                {/* Luz ambiental dorada / color del equipo */}
                <div
                  className="absolute -top-14 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-35 pointer-events-none"
                  style={{ backgroundColor: goalTeamColor }}
                />

                {/* Badge de GOAL tipo retransmisión TV */}
                <div className="relative inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-black tracking-widest uppercase mb-3 shadow-[0_0_15px_rgba(251,191,36,0.3)] animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>¡GOOOL! · GOAL!</span>
                </div>

                {/* Avatar del Jugador con halo dorado */}
                <div className="relative my-2">
                  <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 opacity-60 blur-md animate-pulse" />
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.5)] bg-slate-900 flex items-center justify-center">
                    {goalPhoto ? (
                      <img
                        src={goalPhoto}
                        alt={celebratingGoal.player}
                        className="w-full h-full object-cover object-top scale-105"
                      />
                    ) : (
                      <span className="text-3xl font-bold font-mono text-amber-300">
                        {celebratingGoal.player.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {goalTeamCrest && (
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-slate-950 border-2 border-amber-400/60 p-1 shadow-lg flex items-center justify-center">
                      <img src={goalTeamCrest} alt={goalTeamName} className="w-full h-full object-contain drop-shadow" />
                    </div>
                  )}
                </div>

                {/* Nombre y datos del goleador */}
                <div className="mt-2.5">
                  <h4 className="text-lg sm:text-xl font-black text-white tracking-tight drop-shadow-sm">
                    {celebratingGoal.player}
                  </h4>
                  <div className="flex items-center justify-center gap-2 text-xs font-mono text-slate-300 mt-1">
                    <span className="text-amber-400 font-bold">Min. {celebratingGoal.min ?? celebratingGoal.minute}&apos;</span>
                    <span className="text-slate-600">·</span>
                    <span className="font-semibold text-slate-200">{goalTeamName}</span>
                  </div>
                </div>

                {/* Píldora de métrica xG */}
                <div className="mt-3.5 px-3.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center gap-2 font-mono text-xs">
                  <span className="text-slate-400">Probabilidad:</span>
                  <span className="text-emerald-400 font-bold text-sm">
                    {Number(celebratingGoal.xg || 0).toFixed(2)} xG
                  </span>
                </div>

                {/* Botón de Continuar o temporizador */}
                <div className="mt-4 w-full">
                  <button
                    type="button"
                    onClick={resumeFromGoal}
                    className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all duration-200 shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 group cursor-pointer"
                  >
                    <span>Continuar partido</span>
                    <span className="group-hover:translate-x-0.5 transition-transform font-mono">▶</span>
                  </button>
                </div>
              </div>
            </div>
         )}

         {/* HUD flotante de cronología durante la reproducción */}
         {isPlaying && playMinute !== null && (
            <div className={`absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1 rounded-full border backdrop-blur-md transition-all duration-300 shadow-xl ${
              goalFlash
                ? 'bg-emerald-500/40 border-emerald-400 text-emerald-100 shadow-[0_0_24px_#10b981] scale-110'
                : 'bg-slate-900/90 border-white/15 text-white'
            }`}>
              <span className={`w-2 h-2 rounded-full ${goalFlash ? 'bg-emerald-300 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
              <span className="font-mono font-bold text-xs sm:text-sm tabular-nums">
                {playMinute}&apos;{playMinute > 90 ? '+' : ''}
              </span>
              {goalFlash && (
                <span className="text-[10px] font-black tracking-widest text-emerald-300 animate-bounce uppercase ml-1">
                  ¡GOL!
                </span>
              )}
            </div>
         )}

         <svg viewBox="0 0 600 400" className="w-full max-w-md h-auto overflow-visible">
            {/* Pitch */}
            <rect x="0" y="0" width="600" height="400" fill="none" stroke="#2a3339" strokeWidth="2" />
            <line x1="300" y1="0" x2="300" y2="400" stroke="#2a3339" strokeWidth="2" />
            <circle cx="300" cy="200" r="50" fill="none" stroke="#2a3339" strokeWidth="2" />
            
            {/* Home Penalty Area */}
            <rect x="0" y="80" width="100" height="240" fill="none" stroke="#2a3339" strokeWidth="2" />
            <rect x="0" y="140" width="30" height="120" fill="none" stroke="#2a3339" strokeWidth="2" />
            <path d="M100 160 A40 40 0 0 1 100 240" fill="none" stroke="#2a3339" strokeWidth="2" />

            {/* Away Penalty Area */}
            <rect x="500" y="80" width="100" height="240" fill="none" stroke="#2a3339" strokeWidth="2" />
            <rect x="570" y="140" width="30" height="120" fill="none" stroke="#2a3339" strokeWidth="2" />
            <path d="M500 240 A40 40 0 0 1 500 160" fill="none" stroke="#2a3339" strokeWidth="2" />

            {/* Shots */}
            {visibleShots.map((s, i) => {
               const isGoal = s.result === 'Gol' || s.result === 'Goal';
               const teamColor = s.team === 'home' ? resolvedHomeColor : resolvedAwayColor;
               const isActive = (hoveredShotId != null && String(hoveredShotId) === String(s.id)) || hoverId === s.id;
               const r = Math.max(3.5, s.xg * 16);

               return (
                  <g
                    key={i}
                    className="cursor-pointer"
                    onMouseEnter={() => {
                      setHoverId(s.id);
                      onHoverShot?.(s.id);
                    }}
                    onMouseLeave={() => {
                      setHoverId(null);
                      onHoverShot?.(null);
                    }}
                  >
                     {/* Punto original del disparo (sin halos ni anillos extra) */}
                     <circle
                       cx={getX(s.x)}
                       cy={getY(s.y)}
                       r={r}
                       fill={isGoal ? teamColor : '#1a2024'}
                       stroke={isActive ? '#ffffff' : teamColor}
                       strokeWidth={isActive ? 2 : 1.5}
                       className="transition-all duration-150"
                       opacity={isActive ? 1 : 0.85}
                     />
                     {isActive && (
                        <g className="pointer-events-none">
                          <rect
                            x={getX(s.x) - 60}
                            y={getY(s.y) - r - 24}
                            width={120}
                            height={20}
                            rx={4}
                            fill="#0b0e10"
                            stroke={teamColor}
                            strokeWidth={1.5}
                          />
                          <text
                            x={getX(s.x)}
                            y={getY(s.y) - r - 10}
                            fill="#ffffff"
                            fontSize="10"
                            fontWeight="600"
                            textAnchor="middle"
                            className="font-mono"
                          >
                            {s.player.split(' ').pop()} · {s.xg.toFixed(2)} xG
                          </text>
                        </g>
                     )}
                  </g>
               );
            })}
         </svg>
      </div>
    </div>
  );
}

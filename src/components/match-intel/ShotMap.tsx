"use client";
import React, { useState, useEffect } from 'react';

interface ShotMapProps {
  shots: any[];
  matchData?: any;
  hoveredShotId?: string | number | null;
  onHoverShot?: (id: string | number | null) => void;
}

export default function ShotMap({ shots, matchData, hoveredShotId, onHoverShot }: ShotMapProps) {
  const [filter, setFilter] = useState('Ambos');
  const [subFilter, setSubFilter] = useState<string>('');
  const [hoverId, setHoverId] = useState<string | null>(null);

  const filters = ['Ambos', 'Equipo', 'Jugador'];

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
    if (filter === 'Ambos') return true;
    if (filter === 'Equipo') return s.team === subFilter;
    if (filter === 'Jugador') return s.player === subFilter;
    return true;
  });

  return (
    <div className="glass-card rounded-2xl p-6 h-full flex flex-col transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex justify-between items-start mb-4">
         <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="lbl font-semibold">Mapa de tiros</div>
              {matchData && (
                <div className="flex items-center gap-3 text-xs font-medium text-slate-400 font-mono">
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{background: 'var(--em)'}}></span>{matchData.home_team}</div>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{background: 'var(--or)'}}></span>{matchData.away_team}</div>
                </div>
              )}
            </div>
            {/* Sub-filters based on main filter */}
            {filter === 'Equipo' && (
              <div className="inline-flex gap-1 bg-white/[0.04] p-1 rounded-lg border border-white/10">
                <button onClick={() => setSubFilter('home')} className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${subFilter === 'home' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:text-white'}`}>Local</button>
                <button onClick={() => setSubFilter('away')} className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${subFilter === 'away' ? 'bg-orange-500/20 text-orange-300 font-bold' : 'text-slate-400 hover:text-white'}`}>Visitante</button>
              </div>
            )}
            {filter === 'Jugador' && (
              <select value={subFilter} onChange={e => setSubFilter(e.target.value)} className="bg-slate-900 text-[10px] p-1 rounded-lg text-slate-300 border border-white/10 outline-none focus:border-slate-500 w-fit">
                {Array.from(new Set(shots.map(s => s.player))).sort().map(p => (
                  <option key={p as string} value={p as string}>{p as string}</option>
                ))}
              </select>
            )}
         </div>
         <div className="flex gap-1 bg-white/[0.04] p-1 rounded-lg border border-white/10">
            {filters.map(f => (
               <button key={f} onClick={() => setFilter(f)} className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${filter === f ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'}`}>
                  {f}
               </button>
            ))}
         </div>
      </div>

      <div className="flex-1 relative w-full flex items-center justify-center bg-[#0d1114]/90 rounded-xl border border-white/10 overflow-hidden p-2">
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
               const isGoal = s.result === 'Gol';
               const teamColor = s.team === 'home' ? 'var(--em)' : 'var(--or)';
               const isActive = (hoveredShotId != null && String(hoveredShotId) === String(s.id)) || hoverId === s.id;
               const r = isActive ? Math.max(5, s.xg * 18) : Math.max(3, s.xg * 15);

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
                     {isActive && (
                       <>
                         <circle
                           cx={getX(s.x)}
                           cy={getY(s.y)}
                           r={r + 8}
                           fill={teamColor}
                           opacity="0.25"
                           className="animate-ping"
                         />
                         <circle
                           cx={getX(s.x)}
                           cy={getY(s.y)}
                           r={r + 5}
                           fill="none"
                           stroke={teamColor}
                           strokeWidth="2"
                           strokeDasharray="3 3"
                           opacity="0.9"
                         />
                       </>
                     )}
                     <circle
                       cx={getX(s.x)}
                       cy={getY(s.y)}
                       r={r}
                       fill={isGoal ? teamColor : '#1a2024'}
                       stroke={teamColor}
                       strokeWidth={isActive ? 3 : 2}
                       className="transition-all duration-200"
                       opacity={isActive ? 1 : 0.8}
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
                            stroke="rgba(255,255,255,0.2)"
                            strokeWidth={1}
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

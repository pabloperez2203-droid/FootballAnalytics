"use client";
import React, { useState, useEffect } from 'react';

export default function ShotMap({ shots, matchData }: { shots: any[], matchData?: any }) {
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
    <div className="card glow h-full flex flex-col">
      <div className="flex justify-between items-start mb-4">
         <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="lbl">Mapa de tiros</div>
              {matchData && (
                <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{background: 'var(--em)'}}></span>{matchData.home_team}</div>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{background: 'var(--or)'}}></span>{matchData.away_team}</div>
                </div>
              )}
            </div>
            {/* Sub-filters based on main filter */}
            {filter === 'Equipo' && (
              <div className="inline-flex gap-1 bg-[#1a2024] p-1 rounded border border-[var(--line)]">
                <button onClick={() => setSubFilter('home')} className={`px-2 py-0.5 text-[10px] rounded transition-colors ${subFilter === 'home' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}>Local</button>
                <button onClick={() => setSubFilter('away')} className={`px-2 py-0.5 text-[10px] rounded transition-colors ${subFilter === 'away' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}>Visitante</button>
              </div>
            )}
            {filter === 'Jugador' && (
              <select value={subFilter} onChange={e => setSubFilter(e.target.value)} className="bg-[#1a2024] text-[10px] p-1 rounded text-slate-300 border border-[var(--line)] outline-none focus:border-slate-500 w-fit">
                {Array.from(new Set(shots.map(s => s.player))).sort().map(p => (
                  <option key={p as string} value={p as string}>{p as string}</option>
                ))}
              </select>
            )}
         </div>
         <div className="flex gap-1 bg-[#1a2024] p-1 rounded-md border border-[var(--line)]">
            {filters.map(f => (
               <button key={f} onClick={() => setFilter(f)} className={`px-2 py-1 text-[10px] rounded transition-colors ${filter === f ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>
                  {f}
               </button>
            ))}
         </div>
      </div>

      <div className="flex-1 relative w-full flex items-center justify-center bg-[#13181b] rounded-lg border border-[var(--line)] overflow-hidden p-2">
         <svg viewBox="0 0 600 400" className="w-full max-w-md h-auto">
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
               const r = Math.max(3, s.xg * 15);
               const isGoal = s.result === 'Gol';
               const teamColor = s.team === 'home' ? 'var(--em)' : 'var(--or)';
               const isActive = hoverId === s.id;
               return (
                  <g key={i} onMouseEnter={() => setHoverId(s.id)} onMouseLeave={() => setHoverId(null)}>
                     {isActive && <circle cx={getX(s.x)} cy={getY(s.y)} r={r+6} fill={teamColor} opacity="0.3" />}
                     <circle cx={getX(s.x)} cy={getY(s.y)} r={r} fill={isGoal ? teamColor : '#1a2024'} stroke={teamColor} strokeWidth="2" className="cursor-pointer transition-all duration-300" opacity={0.8} />
                     {isActive && (
                        <text x={getX(s.x)} y={getY(s.y) - r - 5} fill="#fff" fontSize="11" textAnchor="middle" className="pointer-events-none drop-shadow-md">
                           {s.player} ({s.xg.toFixed(2)})
                        </text>
                     )}
                  </g>
               )
            })}
         </svg>
      </div>
    </div>
  );
}

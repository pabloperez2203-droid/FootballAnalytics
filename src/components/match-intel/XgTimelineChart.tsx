"use client";
import React, { useState } from 'react';

interface XgTimelineChartProps {
  shots: any[];
  matchData: any;
  hoveredShotId?: string | number | null;
  onHoverShot?: (id: string | number | null) => void;
}

export default function XgTimelineChart({ shots, matchData, hoveredShotId, onHoverShot }: XgTimelineChartProps) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  
  // Sort shots by minute
  const sortedShots = [...shots].sort((a, b) => a.min - b.min);
  
  // Calculate cumulative xG
  let cumHome = 0;
  let cumAway = 0;
  const dataPoints: { min: number; home: number; away: number; shot: any }[] = [{ min: 0, home: 0, away: 0, shot: null }];
  
  sortedShots.forEach(s => {
      if (s.team === 'home') cumHome += s.xg;
      else cumAway += s.xg;
      dataPoints.push({ min: s.min, home: cumHome, away: cumAway, shot: s });
  });
  dataPoints.push({ min: 90, home: cumHome, away: cumAway, shot: null });

  const getX = (min: number) => 40 + (min / 90) * 500;
  const max_xg = Math.max(matchData.home_xg, matchData.away_xg, 2);
  const getY = (xg: number) => 180 - (xg / max_xg) * 160;

  return (
    <div className="glass-card rounded-2xl p-6 h-full flex flex-col transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-center gap-4 mb-4">
        <div className="lbl font-semibold">xG Acumulado por minuto</div>
        <div className="flex items-center gap-3 text-xs font-medium text-slate-400 font-mono">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{background: 'var(--em)'}}></span>{matchData.home_team}</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{background: 'var(--or)'}}></span>{matchData.away_team}</div>
        </div>
      </div>
      <div className="flex-1 relative min-h-[200px]">
        <svg viewBox="0 0 560 200" className="w-full h-full overflow-visible">
           <g fill="#7d878d" fontSize="9">
              {[0,15,30,45,60,75,90].map(m => (
                 <text key={m} x={getX(m)} y="195" textAnchor="middle">{m}'</text>
              ))}
              {[0, 0.5, 1, 1.5, 2, 2.5].filter(v => v <= max_xg).map(v => (
                 <text key={v} x="30" y={getY(v)+3} textAnchor="end">{v}</text>
              ))}
           </g>
           
           <g stroke="#1e2428" strokeWidth="1">
              {[0, 0.5, 1, 1.5, 2, 2.5].filter(v => v <= max_xg).map(v => (
                 <path key={v} d={`M40 ${getY(v)}H540`} strokeDasharray="3 3"/>
              ))}
           </g>

           {/* Lines */}
           <path d={`M${dataPoints.map(p => `${getX(p.min)},${getY(p.home)}`).join(' L')}`} fill="none" stroke="var(--em)" strokeWidth="2.5" />
           <path d={`M${dataPoints.map(p => `${getX(p.min)},${getY(p.away)}`).join(' L')}`} fill="none" stroke="var(--or)" strokeWidth="2.5" />

           {/* Points */}
           {dataPoints.map((p, i) => {
              if (!p.shot) return null;
              const shot = p.shot;
              const isGoal = shot.result === 'Gol';
              const teamColor = shot.team === 'home' ? 'var(--em)' : 'var(--or)';
              const y = shot.team === 'home' ? getY(p.home) : getY(p.away);
              const isActive = (hoveredShotId != null && String(hoveredShotId) === String(shot.id)) || hoverId === shot.id;
              return (
                 <g
                    key={i}
                    className="cursor-pointer"
                    onMouseEnter={() => {
                      setHoverId(shot.id);
                      onHoverShot?.(shot.id);
                    }}
                    onMouseLeave={() => {
                      setHoverId(null);
                      onHoverShot?.(null);
                    }}
                 >
                    {isActive && (
                      <>
                        <circle cx={getX(p.min)} cy={y} r="16" fill={teamColor} opacity="0.25" className="animate-ping"/>
                        <circle cx={getX(p.min)} cy={y} r="12" fill={teamColor} opacity="0.35"/>
                      </>
                    )}
                    <circle
                      cx={getX(p.min)}
                      cy={y}
                      r={isActive ? (isGoal ? 7 : 5) : (isGoal ? 5 : 3)}
                      fill={isGoal ? teamColor : '#1a2024'}
                      stroke={teamColor}
                      strokeWidth={isGoal ? 0 : 2}
                      className="transition-all duration-200"
                    />
                    {isActive && (
                       <g className="pointer-events-none">
                         <rect
                           x={getX(p.min) - 50}
                           y={y - 28}
                           width={100}
                           height={18}
                           rx={4}
                           fill="#0b0e10"
                           stroke="rgba(255,255,255,0.2)"
                           strokeWidth={1}
                         />
                         <text x={getX(p.min)} y={y - 15} fill="#fff" fontSize="9" fontWeight="600" textAnchor="middle" className="font-mono">
                           {shot.player.split(' ').pop()} ({shot.xg.toFixed(2)})
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

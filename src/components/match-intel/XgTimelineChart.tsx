"use client";
import React, { useState } from 'react';

export default function XgTimelineChart({ shots, matchData }: { shots: any[], matchData: any }) {
  const [hoverId, setHoverId] = useState<string | null>(null);
  
  // Sort shots by minute
  const sortedShots = [...shots].sort((a, b) => a.min - b.min);
  
  // Calculate cumulative xG
  let cumHome = 0;
  let cumAway = 0;
  const dataPoints = [{ min: 0, home: 0, away: 0, shot: null }];
  
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
    <div className="card glow h-full flex flex-col">
      <div className="flex items-center gap-4 mb-4">
        <div className="lbl">xG Acumulado por minuto</div>
        <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
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
           <path d={`M${dataPoints.map(p => `${getX(p.min)},${getY(p.home)}`).join(' L')}`} fill="none" stroke="var(--em)" strokeWidth="2" />
           <path d={`M${dataPoints.map(p => `${getX(p.min)},${getY(p.away)}`).join(' L')}`} fill="none" stroke="var(--or)" strokeWidth="2" />

           {/* Points */}
           {dataPoints.filter(p => p.shot).map((p, i) => {
              const isGoal = p.shot.result === 'Gol';
              const teamColor = p.shot.team === 'home' ? 'var(--em)' : 'var(--or)';
              const y = p.shot.team === 'home' ? getY(p.home) : getY(p.away);
              const isActive = hoverId === p.shot.id;
              return (
                 <g key={i} onMouseEnter={() => setHoverId(p.shot.id)} onMouseLeave={() => setHoverId(null)}>
                    {isActive && <circle cx={getX(p.min)} cy={y} r="12" fill={teamColor} opacity="0.2"/>}
                    <circle cx={getX(p.min)} cy={y} r={isGoal ? 5 : 3} fill={isGoal ? teamColor : '#1a2024'} stroke={teamColor} strokeWidth={isGoal ? 0 : 2} className="cursor-pointer" />
                    {isActive && (
                       <text x={getX(p.min)} y={y - 15} fill="#fff" fontSize="10" textAnchor="middle" className="pointer-events-none">
                         {p.shot.player} ({p.shot.xg.toFixed(2)})
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

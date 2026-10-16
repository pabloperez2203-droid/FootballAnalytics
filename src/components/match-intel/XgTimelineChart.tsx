"use client";
import React, { useState } from 'react';
import { getMatchTeamColors } from '@/utils/crests';

interface XgTimelineChartProps {
  shots: any[];
  matchData: any;
  hoveredShotId?: string | number | null;
  onHoverShot?: (id: string | number | null) => void;
  homeColor?: string;
  awayColor?: string;
}

export default function XgTimelineChart({
  shots,
  matchData,
  hoveredShotId,
  onHoverShot,
  homeColor,
  awayColor
}: XgTimelineChartProps) {
  const [hoverId, setHoverId] = useState<string | null>(null);

  const colors = (homeColor && awayColor)
    ? { homeColor, awayColor }
    : getMatchTeamColors(matchData.home_team, matchData.away_team);
  const resolvedHomeColor = colors.homeColor;
  const resolvedAwayColor = colors.awayColor;
  
  // Sort shots by minute
  const sortedShots = [...shots].sort((a, b) => (a.min ?? a.minute ?? 0) - (b.min ?? b.minute ?? 0));
  
  // Calculate dynamic max minute to prevent stoppage time overflow (>90')
  const shotMinutes = shots.map(s => Number(s.min ?? s.minute ?? 0)).filter(m => !isNaN(m));
  const maxMinute = Math.max(90, ...shotMinutes);

  // Calculate cumulative xG
  let cumHome = 0;
  let cumAway = 0;
  const dataPoints: { min: number; home: number; away: number; shot: any }[] = [{ min: 0, home: 0, away: 0, shot: null }];
  
  sortedShots.forEach(s => {
      const min = Number(s.min ?? s.minute ?? 0);
      if (s.team === 'home') cumHome += s.xg;
      else cumAway += s.xg;
      dataPoints.push({ min, home: cumHome, away: cumAway, shot: s });
  });
  dataPoints.push({ min: maxMinute, home: cumHome, away: cumAway, shot: null });

  const getX = (min: number) => 40 + (min / maxMinute) * 500;
  const max_xg = Math.max(matchData.home_xg || 0, matchData.away_xg || 0, cumHome, cumAway, 2);
  const getY = (xg: number) => 180 - (xg / max_xg) * 160;

  // Dynamic ticks including stoppage time if >90'
  const ticks = [0, 15, 30, 45, 60, 75, 90, ...(maxMinute > 90 ? [maxMinute] : [])];

  return (
    <div className="glass-card rounded-2xl p-6 h-full flex flex-col transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-center gap-4 mb-4">
        <div className="lbl font-semibold">xG Acumulado por minuto</div>
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
      </div>
      <div className="flex-1 relative min-h-[200px]">
        <svg viewBox="0 0 560 200" className="w-full h-full overflow-visible">
           <defs>
              <linearGradient id="homeXgGrad" x1="0" y1="0" x2="0" y2="1">
                 <stop offset="0%" stopColor={resolvedHomeColor} stopOpacity="0.22" />
                 <stop offset="100%" stopColor={resolvedHomeColor} stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="awayXgGrad" x1="0" y1="0" x2="0" y2="1">
                 <stop offset="0%" stopColor={resolvedAwayColor} stopOpacity="0.22" />
                 <stop offset="100%" stopColor={resolvedAwayColor} stopOpacity="0.0" />
              </linearGradient>
           </defs>

           {/* Reference Lines (Descanso 45' y 90') */}
           <g stroke="#64748b" strokeWidth="1" strokeDasharray="3 3" opacity="0.4">
              <line x1={getX(45)} y1="20" x2={getX(45)} y2="180" />
              <line x1={getX(90)} y1="20" x2={getX(90)} y2="180" />
           </g>
           <g fill="#94a3b8" fontSize="8" fontWeight="500">
              <text x={getX(45)} y="15" textAnchor="middle">Descanso (45')</text>
              <text x={getX(90)} y="15" textAnchor="middle">90'</text>
           </g>

           <g fill="#7d878d" fontSize="9">
              {ticks.map(m => (
                 <text key={m} x={getX(m)} y="195" textAnchor="middle">{m}'</text>
              ))}
              {[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4].filter(v => v <= max_xg).map(v => (
                 <text key={v} x="30" y={getY(v)+3} textAnchor="end">{v}</text>
              ))}
           </g>
           
           <g stroke="#1e2428" strokeWidth="1">
              {[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4].filter(v => v <= max_xg).map(v => (
                 <path key={v} d={`M40 ${getY(v)}H540`} strokeDasharray="3 3"/>
              ))}
           </g>

           {/* Áreas bajo la curva con gradientes corporativos */}
           <path
              d={`M40,180 L${dataPoints.map(p => `${getX(p.min)},${getY(p.home)}`).join(' L')} L${getX(maxMinute)},180 Z`}
              fill="url(#homeXgGrad)"
           />
           <path
              d={`M40,180 L${dataPoints.map(p => `${getX(p.min)},${getY(p.away)}`).join(' L')} L${getX(maxMinute)},180 Z`}
              fill="url(#awayXgGrad)"
           />

           {/* Líneas corporativas de xG acumulado */}
           <path
              d={`M${dataPoints.map(p => `${getX(p.min)},${getY(p.home)}`).join(' L')}`}
              fill="none"
              stroke={resolvedHomeColor}
              strokeWidth="2.5"
           />
           <path
              d={`M${dataPoints.map(p => `${getX(p.min)},${getY(p.away)}`).join(' L')}`}
              fill="none"
              stroke={resolvedAwayColor}
              strokeWidth="2.5"
           />

           {/* Points */}
           {dataPoints.map((p, i) => {
              if (!p.shot) return null;
              const shot = p.shot;
              const isGoal = shot.result === 'Gol';
              const teamColor = shot.team === 'home' ? resolvedHomeColor : resolvedAwayColor;
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
                    {/* Punto de disparo limpio sin halos ni pulsos animados */}
                    <circle
                      cx={getX(p.min)}
                      cy={y}
                      r={isGoal ? 5 : 3.5}
                      fill={isGoal ? teamColor : '#1a2024'}
                      stroke={isActive ? '#ffffff' : teamColor}
                      strokeWidth={isActive ? 2 : (isGoal ? 0 : 1.5)}
                      className="transition-all duration-150"
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
                           stroke={teamColor}
                           strokeWidth={1.5}
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

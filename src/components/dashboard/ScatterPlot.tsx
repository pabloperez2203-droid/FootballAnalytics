"use client";
import React, { useState } from "react";

interface ScatterPlotProps {
  plotData: { id: string; label: string; subLabel: string; xg: number; goals: number; diff: number }[];
  plotMode: "teams" | "players";
  setPlotMode: (mode: "teams" | "players") => void;
  allTeamNames: string[];
  filterTeam: string;
  setFilterTeam: (team: string) => void;
}

export default function ScatterPlot({ plotData, plotMode, setPlotMode, allTeamNames, filterTeam, setFilterTeam }: ScatterPlotProps) {
  const [hoverTeam, setHoverTeam] = useState<string | null>(null);
  const [lockedTeam, setLockedTeam] = useState<string | null>(null);

  // X = xG, Y = Goals
  const allGoals = plotData.map(t => t.goals);
  const allXg = plotData.map(t => t.xg);

  const dataMinRaw = Math.min(...allGoals, ...allXg);
  const dataMaxRaw = Math.max(...allGoals, ...allXg);
  const dataRange = Math.max(dataMaxRaw - dataMinRaw, 1);
  const margin = dataRange * 0.1;

  const axisStep = plotMode === "players" ? 2 : 5;
  const baseAxisMin = Math.max(0, Math.floor((dataMinRaw - margin) / axisStep) * axisStep);
  const baseAxisMax = Math.ceil((dataMaxRaw + margin) / axisStep) * axisStep;

  const rangeX = Math.max(baseAxisMax - baseAxisMin, 0.1);
  const rangeY = Math.max(baseAxisMax - baseAxisMin, 0.1);

  const getX = (xg: number) => 50 + ((xg - baseAxisMin) / rangeX) * 700;
  const getY = (goals: number) => 400 - ((goals - baseAxisMin) / rangeY) * 380;

  const axisValuesX = [];
  for (let v = Math.max(0, Math.floor(baseAxisMin / axisStep) * axisStep); v <= baseAxisMax; v += axisStep) {
    if (v >= baseAxisMin && v <= baseAxisMax) axisValuesX.push(v);
  }
  const axisValuesY = [];
  for (let v = Math.max(0, Math.floor(baseAxisMin / axisStep) * axisStep); v <= baseAxisMax; v += axisStep) {
    if (v >= baseAxisMin && v <= baseAxisMax) axisValuesY.push(v);
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (800 / rect.width);
    const py = (e.clientY - rect.top) * (450 / rect.height);

    if (px >= 50 && px <= 750 && py >= 20 && py <= 400) {
      let closest = null;
      let minDist = 30;
      plotData.forEach(item => {
        const cx = getX(item.xg);
        const cy = getY(item.goals);
        if (cx < 50 || cx > 750 || cy < 20 || cy > 400) return;
        const dist = Math.hypot(cx - px, cy - py);
        if (dist < minDist) {
          minDist = dist;
          closest = item.id;
        }
      });
      setHoverTeam(closest);
    } else {
      setHoverTeam(null);
    }
  };

  const handleMouseLeave = () => {
    setHoverTeam(null);
  };

  const handleClick = () => {
    if (hoverTeam) {
      setLockedTeam(lockedTeam === hoverTeam ? null : hoverTeam);
    } else {
      setLockedTeam(null);
    }
  };

  const activeId = lockedTeam || hoverTeam;
  const activeItem = plotData.find(d => d.id === activeId) || plotData.reduce((prev, curr) => prev.diff > curr.diff ? prev : curr, plotData[0]);

  // Determine top 3 over and under performers for permanent labels
  const sortedByDiff = [...plotData].sort((a, b) => b.diff - a.diff);
  const permanentLabels = new Set([
    ...sortedByDiff.slice(0, 3).map(d => d.id),
    ...sortedByDiff.slice(-3).map(d => d.id)
  ]);

  // Collision detection for labels
  const placedLabels: { x: number, y: number, w: number, h: number }[] = [];
  const doesCollide = (x: number, y: number, w: number, h: number) => {
    if (x < 50 || x + w > 750 || y - h < 20 || y > 400) return true;
    for (const p of placedLabels) {
      if (x < p.x + p.w && x + w > p.x && y - h < p.y && y > p.y - p.h) return true;
    }
    return false;
  };

  return (
    <section className="card glow md:col-span-8 md:row-span-2 flex flex-col relative z-10">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4 relative z-20">
        <div>
          <div className="lbl flex items-center gap-2">
            Gráfico principal
            <div className="flex bg-[#1a2024] rounded-md border border-[var(--line)] overflow-hidden">
              <button onClick={() => setPlotMode("teams")} className={`px-3 py-1 text-xs transition-colors ${plotMode === "teams" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"}`}>Equipos</button>
              <button onClick={() => setPlotMode("players")} className={`px-3 py-1 text-xs transition-colors ${plotMode === "players" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"}`}>Jugadores</button>
            </div>
            {plotMode === "players" && (
              <select value={filterTeam} onChange={e => setFilterTeam(e.target.value)} className="bg-[#1a2024] border border-[var(--line)] rounded-md text-xs px-2 py-1 text-slate-300 outline-none">
                <option value="ALL">Todos los equipos</option>
                {allTeamNames.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
          </div>
          <h1 className="text-xl font-semibold tracking-tight mt-2">Goles reales vs xG esperado</h1>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-4 text-xs" style={{ color: "var(--mut)" }}>
            <span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-full" style={{ background: "var(--em)" }}></i>Supera su xG</span>
            <span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-full" style={{ background: "var(--or)" }}></i>Por debajo</span>
          </div>
        </div>
      </div>

      <div className={`relative flex-1 ${activeId ? "dim" : ""}`}>
        <svg id="sc" viewBox="0 0 800 450" className="w-full h-auto cursor-crosshair"
          onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} onClick={handleClick}>
          <defs>
            <linearGradient id="gUp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#10b981" stopOpacity=".10" /><stop offset="1" stopColor="#10b981" stopOpacity="0" /></linearGradient>
            <linearGradient id="gDn" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#f97316" stopOpacity=".09" /><stop offset="1" stopColor="#f97316" stopOpacity="0" /></linearGradient>
          </defs>
          <polygon points="50,400 750,20 50,20" fill="url(#gUp)" opacity="0" />
          <polygon points="50,20 750,20 750,20 50,400" fill="url(#gUp)" />
          <polygon points="50,400 750,400 750,20" fill="url(#gDn)" />

          <g stroke="#1e2428" strokeWidth="1">
            {axisValuesY.map(v => <path key={`h-${v}`} d={`M50 ${getY(v)}H750`} />)}
            {axisValuesX.map(v => <path key={`v-${v}`} d={`M${getX(v)} 20V400`} />)}
          </g>
          <g fill="#7d878d" fontSize="10">
            {axisValuesY.map(v => <text key={`yl-${v}`} x="40" y={getY(v) + 4} textAnchor="end">{v}</text>)}
            {axisValuesX.map((v, i) => <text key={`xl-${v}`} x={getX(v)} y="418" textAnchor={i === 0 ? "start" : i === axisValuesX.length - 1 ? "end" : "middle"}>{v}</text>)}
          </g>

          <text x="400" y="440" fill="#3a4247" fontSize="10" textAnchor="middle" fontStyle="italic">xG esperado ➔</text>
          <text x="15" y="210" fill="#3a4247" fontSize="10" transform="rotate(-90 15 210)" textAnchor="middle" fontStyle="italic">Goles reales ➔</text>

          <path d="M50 400L750 20" stroke="#9aa5ab" strokeWidth="1.2" strokeDasharray="5 5" opacity=".2" />



          <g id="pts" fontSize="11" fill="#e8ecee">
            {/* Sort so hovered point is drawn last (on top) */}
            {[...plotData].sort((a, b) => (a.id === activeId ? 1 : -1)).map(item => {
              const cx = getX(item.xg);
              const cy = getY(item.goals);

              if (cx < 40 || cx > 760 || cy < 10 || cy > 410) {
                // Out of bounds indicator
                const edgeX = Math.max(50, Math.min(750, cx));
                const edgeY = Math.max(20, Math.min(400, cy));
                return (
                  <g key={`${item.id}-out`} opacity="0.6">
                    <polygon points={`${edgeX},${edgeY} ${edgeX - 6},${edgeY + 8} ${edgeX + 6},${edgeY + 8}`} fill="var(--em)" transform={`rotate(${cx > 750 ? 90 : cx < 50 ? -90 : cy < 20 ? 0 : 180} ${edgeX} ${edgeY})`} />
                    <text x={edgeX + (cx > 750 ? -10 : cx < 50 ? 10 : 0)} y={edgeY + (cy > 400 ? -10 : cy < 20 ? 15 : 0)} fontSize="9" fill="var(--mut)" textAnchor={cx > 750 ? "end" : cx < 50 ? "start" : "middle"}>{item.label}</text>
                  </g>
                )
              }

              const isPositive = item.diff > 0;
              const isActive = activeId === item.id;
              let shouldLabel = permanentLabels.has(item.id) || isActive;

              let labelX = cx + 8;
              let labelY = cy - 4;
              let showLabel = shouldLabel;

              if (shouldLabel && !isActive) {
                // Simple collision avoidance placement
                const w = item.label.length * 6;
                if (!doesCollide(cx + 8, cy - 4, w, 12)) {
                  placedLabels.push({ x: cx + 8, y: cy - 4, w, h: 12 });
                } else if (!doesCollide(cx - w - 8, cy - 4, w, 12)) {
                  labelX = cx - w - 8;
                  placedLabels.push({ x: labelX, y: cy - 4, w, h: 12 });
                } else if (!doesCollide(cx - w / 2, cy + 16, w, 12)) {
                  labelX = cx - w / 2; labelY = cy + 16;
                  placedLabels.push({ x: labelX, y: labelY, w, h: 12 });
                } else if (!doesCollide(cx - w / 2, cy - 14, w, 12)) {
                  labelX = cx - w / 2; labelY = cy - 14;
                  placedLabels.push({ x: labelX, y: labelY, w, h: 12 });
                } else {
                  showLabel = false; // no fit
                }
              }

              return (
                <g key={item.id} className={`pt ${isActive ? "on" : ""}`} style={{ pointerEvents: "none" }}>
                  {isActive && <circle cx={cx} cy={cy} r="22" fill={isPositive ? "#10b981" : "#f97316"} opacity=".15" />}
                  <circle cx={cx} cy={cy} r={isActive ? 8 : (plotMode === "players" ? 3 : 5.5)} fill={isPositive ? "#10b981" : "#f97316"} stroke="#0b0e10" strokeWidth="1.5" opacity={plotMode === "players" ? 0.7 : 1} />
                  {showLabel && (
                    <text x={labelX} y={labelY} opacity={1} fontSize={plotMode === "players" ? "9" : "10"} fontWeight={isActive ? "bold" : "normal"}>
                      {item.label}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div className="mt-4 text-sm px-4 py-3 rounded-xl flex flex-wrap items-center justify-between gap-2 shadow-lg relative z-20" style={{ background: "#0b0e10", border: "1px solid var(--line)" }}>
        {activeItem ? (
          <>
            <span>
              <b id="tn">{activeItem.label} {activeItem.subLabel ? `(${activeItem.subLabel})` : ''}</b>
              <span style={{ color: "var(--mut)" }}> · xG {activeItem.xg.toFixed(2)} · Goles {activeItem.goals}</span>
            </span>
            <span id="td" className="font-semibold" style={{ color: activeItem.diff > 0 ? "var(--em)" : "var(--or)" }}>
              {activeItem.diff > 0 ? "+" : "−"}{Math.abs(activeItem.diff).toFixed(2)} vs esperado
            </span>
          </>
        ) : (
          <span style={{ color: "var(--mut)" }}>Pasa el ratón sobre un punto para ver detalles</span>
        )}
      </div>
    </section>
  );
}

"use client";
import React, { useState } from "react";
import { getTeamCrest } from "@/utils/crests";

interface ScatterPlotProps {
  plotData: { id: string; label: string; subLabel: string; xg: number; goals: number; diff: number; team?: string }[];
  plotMode: "teams" | "players";
  setPlotMode: (mode: "teams" | "players") => void;
  allTeamNames: string[];
  filterTeam: string;
  setFilterTeam: (team: string) => void;
}

export default function ScatterPlot({ plotData, plotMode, setPlotMode, allTeamNames, filterTeam, setFilterTeam }: ScatterPlotProps) {
  const [hoverTeam, setHoverTeam] = useState<string | null>(null);
  const [lockedTeam, setLockedTeam] = useState<string | null>(null);
  const [selectedQuadrant, setSelectedQuadrant] = useState<number | null>(null);

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

  // Quadrants logic
  const avgXg = plotData.length > 0 ? (plotData.reduce((acc, curr) => acc + curr.xg, 0) / plotData.length) : 0;
  const avgGoals = plotData.length > 0 ? (plotData.reduce((acc, curr) => acc + curr.goals, 0) / plotData.length) : 0;

  const quadrants = [
    {
      id: 1,
      badge: "Q1",
      name: "Élite Ofensiva",
      description: "Alto xG & Altos Goles (Dominio creativo y pegada de élite)",
      color: "#10b981",
      filter: (item: any) => item.xg >= avgXg && item.goals >= avgGoals,
    },
    {
      id: 2,
      badge: "Q2",
      name: "Oportunistas / Máxima Eficacia",
      description: "Bajo xG pero Altos Goles (Aprovechamiento máximo, G > xG)",
      color: "#06b6d4",
      filter: (item: any) => item.xg < avgXg && item.goals >= avgGoals,
    },
    {
      id: 3,
      badge: "Q3",
      name: "Pólvora Mojada / Infrarrendimiento",
      description: "Alto xG pero Bajos Goles (Crean peligro pero baja conversión)",
      color: "#f59e0b",
      filter: (item: any) => item.xg >= avgXg && item.goals < avgGoals,
    },
    {
      id: 4,
      badge: "Q4",
      name: "Bajo Volumen Ofensivo",
      description: "Bajo xG & Bajos Goles (Dificultades en generación y remate)",
      color: "#f43f5e",
      filter: (item: any) => item.xg < avgXg && item.goals < avgGoals,
    },
  ];

  const currentQuadrantData = selectedQuadrant !== null 
    ? quadrants.find(q => q.id === selectedQuadrant)
    : null;

  const quadrantTeams = currentQuadrantData
    ? plotData.filter(currentQuadrantData.filter)
    : [];

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
    <section className="glass-card md:col-span-8 md:row-span-2 flex flex-col p-6 rounded-2xl relative z-10 transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4 relative z-20">
        <div>
          <div className="lbl flex flex-wrap items-center gap-2">
            Gráfico principal
            <div className="flex bg-white/[0.04] rounded-lg border border-white/10 overflow-hidden">
              <button
                onClick={() => setPlotMode("teams")}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  plotMode === "teams"
                    ? "bg-emerald-500/20 text-emerald-300 border-r border-white/10 font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Equipos
              </button>
              <button
                onClick={() => setPlotMode("players")}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  plotMode === "players"
                    ? "bg-emerald-500/20 text-emerald-300 font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Jugadores
              </button>
            </div>
            {plotMode === "players" && (
              <select
                value={filterTeam}
                onChange={(e) => setFilterTeam(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-lg text-xs px-2.5 py-1 text-slate-300 outline-none"
              >
                <option value="ALL">Todos los equipos</option>
                {allTeamNames.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            )}
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white mt-2">Goles reales vs xG esperado</h1>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-4 text-xs" style={{ color: "var(--mut)" }}>
            <span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-full" style={{ background: "var(--em)" }}></i>Supera su xG</span>
            <span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-full" style={{ background: "var(--or)" }}></i>Por debajo</span>
          </div>

          {/* Botones de cuadrantes cuando está en modo equipos */}
          {plotMode === "teams" && (
            <div className="flex flex-wrap items-center gap-1 mt-1">
              {quadrants.map(q => {
                const isSelected = selectedQuadrant === q.id;
                return (
                  <button
                    key={q.id}
                    onClick={() => setSelectedQuadrant(isSelected ? null : q.id)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-mono transition-all ${
                      isSelected
                        ? "bg-white/15 text-white shadow-sm ring-1"
                        : "bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]"
                    }`}
                    style={{ borderColor: isSelected ? q.color : undefined }}
                    title={q.description}
                  >
                    <span className="font-bold mr-1" style={{ color: q.color }}>{q.badge}</span>
                    <span className="hidden sm:inline">{q.name.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>
          )}
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

          {/* Líneas divisorias de Cuadrantes basadas en las medias */}
          {plotMode === "teams" && (
            <g stroke="#ffffff" strokeWidth="1" strokeDasharray="4 4" opacity="0.15">
              <line x1={getX(avgXg)} y1={20} x2={getX(avgXg)} y2={400} />
              <line x1={50} y1={getY(avgGoals)} x2={750} y2={getY(avgGoals)} />
              <text x={getX(avgXg) + 5} y={32} fill="#94a3b8" fontSize="9" fontStyle="italic">Media xG ({avgXg.toFixed(1)})</text>
              <text x={740} y={getY(avgGoals) - 5} fill="#94a3b8" fontSize="9" textAnchor="end" fontStyle="italic">Media Goles ({avgGoals.toFixed(1)})</text>
            </g>
          )}

          <g fill="#7d878d" fontSize="10">
            {axisValuesY.map(v => <text key={`yl-${v}`} x="40" y={getY(v) + 4} textAnchor="end">{v}</text>)}
            {axisValuesX.map((v, i) => <text key={`xl-${v}`} x={getX(v)} y="418" textAnchor={i === 0 ? "start" : i === axisValuesX.length - 1 ? "end" : "middle"}>{v}</text>)}
          </g>

          <text x="400" y="440" fill="#475569" fontSize="10" textAnchor="middle" fontStyle="italic">xG esperado ➔</text>
          <text x="15" y="210" fill="#475569" fontSize="10" transform="rotate(-90 15 210)" textAnchor="middle" fontStyle="italic">Goles reales ➔</text>

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

              let labelX = cx + 14;
              let labelY = cy - 4;
              let showLabel = shouldLabel;

              if (shouldLabel && !isActive) {
                // Simple collision avoidance placement
                const w = item.label.length * 6;
                if (!doesCollide(cx + 14, cy - 4, w, 12)) {
                  placedLabels.push({ x: cx + 14, y: cy - 4, w, h: 12 });
                } else if (!doesCollide(cx - w - 14, cy - 4, w, 12)) {
                  labelX = cx - w - 14;
                  placedLabels.push({ x: labelX, y: cy - 4, w, h: 12 });
                } else if (!doesCollide(cx - w / 2, cy + 18, w, 12)) {
                  labelX = cx - w / 2; labelY = cy + 18;
                  placedLabels.push({ x: labelX, y: labelY, w, h: 12 });
                } else if (!doesCollide(cx - w / 2, cy - 16, w, 12)) {
                  labelX = cx - w / 2; labelY = cy - 16;
                  placedLabels.push({ x: labelX, y: labelY, w, h: 12 });
                } else {
                  showLabel = false; // no fit
                }
              }

              const crestUrl = plotMode === "teams" ? getTeamCrest(item.team || item.label) : null;

              return (
                <g key={item.id} className={`pt ${isActive ? "on" : ""}`} style={{ pointerEvents: "none" }}>
                  {plotMode === "teams" ? (
                    <g>
                      {isActive && (
                        <circle cx={cx} cy={cy} r="18" fill={isPositive ? "#10b981" : "#f43f5e"} opacity=".35" className="animate-pulse" />
                      )}
                      {/* Borde circular sutil */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r="13"
                        fill="#0f172a"
                        stroke={isActive ? (isPositive ? "#10b981" : "#f43f5e") : "rgba(255,255,255,0.2)"}
                        strokeWidth={isActive ? 2 : 1}
                      />
                      <clipPath id={`crest-clip-${item.id}`}>
                        <circle cx={cx} cy={cy} r="11" />
                      </clipPath>
                      {crestUrl ? (
                        <image
                          href={crestUrl}
                          x={cx - 11}
                          y={cy - 11}
                          width={22}
                          height={22}
                          clipPath={`url(#crest-clip-${item.id})`}
                        />
                      ) : (
                        <circle cx={cx} cy={cy} r="11" fill={isPositive ? "#10b981" : "#f43f5e"} />
                      )}
                    </g>
                  ) : (
                    <>
                      {isActive && <circle cx={cx} cy={cy} r="22" fill={isPositive ? "#10b981" : "#f97316"} opacity=".15" />}
                      <circle cx={cx} cy={cy} r={isActive ? 8 : 3.5} fill={isPositive ? "#10b981" : "#f97316"} stroke="#0b0e10" strokeWidth="1.5" opacity={0.8} />
                    </>
                  )}

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

      <div className="mt-4 text-sm px-4 py-3 rounded-xl flex flex-wrap items-center justify-between gap-2 shadow-lg relative z-20 bg-slate-950/80 border border-white/10 backdrop-blur-md">
        {activeItem ? (
          <>
            <span>
              <b id="tn" className="text-white font-semibold">{activeItem.label} {activeItem.subLabel ? `(${activeItem.subLabel})` : ''}</b>
              <span className="text-slate-400 font-mono text-xs"> · xG <strong className="text-slate-200">{activeItem.xg.toFixed(2)}</strong> · Goles <strong className="text-white">{activeItem.goals}</strong></span>
            </span>
            <span id="td" className="font-mono font-bold text-xs sm:text-sm tabular-nums" style={{ color: activeItem.diff > 0 ? "var(--em)" : "var(--or)" }}>
              {activeItem.diff > 0 ? "+" : "−"}{Math.abs(activeItem.diff).toFixed(2)} vs esperado
            </span>
          </>
        ) : (
          <span className="text-slate-400 text-xs">Pasa el ratón sobre un punto para ver detalles</span>
        )}
      </div>

      {/* Panel de Cuadrantes Integrado */}
      {selectedQuadrant !== null && currentQuadrantData && (
        <div className="mt-4 p-5 rounded-2xl glass-card border border-white/10 animate-fadeIn">
          <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-mono font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: `${currentQuadrantData.color}25`, color: currentQuadrantData.color, border: `1px solid ${currentQuadrantData.color}50` }}
                >
                  {currentQuadrantData.badge}
                </span>
                <h4 className="font-bold text-white text-base">{currentQuadrantData.name}</h4>
              </div>
              <p className="text-xs text-slate-400 mt-1">{currentQuadrantData.description}</p>
            </div>
            <button
              onClick={() => setSelectedQuadrant(null)}
              className="text-xs font-mono px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/5"
            >
              ✕ Cerrar
            </button>
          </div>

          {quadrantTeams.length === 0 ? (
            <div className="text-xs text-slate-400 py-3 text-center">No hay equipos en este cuadrante con la selección actual.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {quadrantTeams.map(t => {
                const crest = getTeamCrest(t.team || t.label);
                const isPos = t.diff > 0;
                return (
                  <div
                    key={t.id}
                    onClick={() => setLockedTeam(lockedTeam === t.id ? null : t.id)}
                    className={`p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 flex items-center justify-between gap-2 cursor-pointer transition-all ${
                      activeId === t.id ? "ring-1 ring-emerald-500 bg-white/[0.08]" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-7 h-7 rounded-full bg-white/5 p-1 shrink-0 flex items-center justify-center">
                        {crest ? (
                          <img src={crest} alt={t.label} className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-[10px] font-bold">{t.label.substring(0, 2)}</span>
                        )}
                      </div>
                      <span className="font-medium text-xs text-white truncate">{t.label}</span>
                    </div>
                    <div className="text-right font-mono text-xs shrink-0">
                      <div className="text-slate-300">
                        <span className="text-slate-500 text-[10px]">xG</span> {t.xg.toFixed(1)} · <span className="text-slate-500 text-[10px]">G</span> {t.goals}
                      </div>
                      <div className="font-bold text-[11px] tabular-nums" style={{ color: isPos ? "#10b981" : "#f43f5e" }}>
                        {isPos ? "+" : ""}{t.diff.toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

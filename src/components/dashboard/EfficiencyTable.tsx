"use client";

import React, { useState } from "react";

interface TeamStat {
  rank: number;
  id: string; // for the data-t attribute
  name: string;
  pj: number;
  xg: number;
  goals: number;
  diff: number;
  xg90: number;
  xga: number;
  ga: number;
  diffXg: number;
  maxDiff: number;
}

interface EfficiencyTableProps {
  data: TeamStat[];
  activeTeam: string | null;
  onHoverTeam: (id: string | null) => void;
}

export default function EfficiencyTable({ data, activeTeam, onHoverTeam }: EfficiencyTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof TeamStat; direction: "asc" | "desc" } | null>(null);
  const [showAll, setShowAll] = useState(false);

  const sortedData = React.useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "asc" ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const displayedData = showAll ? sortedData : sortedData.slice(0, 5);

  const requestSort = (key: keyof TeamStat) => {
    let direction: "asc" | "desc" = "desc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "desc") {
      direction = "asc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof TeamStat) => {
    if (!sortConfig || sortConfig.key !== key) return <span className="absolute ml-1 opacity-0 group-hover:opacity-30">↕</span>;
    return sortConfig.direction === "asc" ? <span className="absolute ml-1 text-[var(--em)]">↑</span> : <span className="absolute ml-1 text-[var(--em)]">↓</span>;
  };

  return (
    <section className="glass-card md:col-span-8 flex flex-col p-6 rounded-2xl transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="lbl font-semibold">Clasificación analítica</div>
          <div className="font-bold text-base text-white mt-1">Eficiencia y Desempeño Ofensivo/Defensivo</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400">
            Jornada {data[0]?.pj || 0}
          </span>
          <button 
            onClick={() => setShowAll(!showAll)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 transition-colors text-slate-300"
          >
            {showAll ? "Ver Top 5" : "Ver todos"}
          </button>
        </div>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-xs lg:text-sm font-sans" id="tb">
          <thead>
            <tr className="lbl text-left border-b border-white/10 font-mono">
              <th className="py-2.5 font-normal w-6 cursor-pointer group" onClick={() => requestSort('rank')}>
                # {getSortIcon('rank')}
              </th>
              <th className="font-normal cursor-pointer group" onClick={() => requestSort('name')}>
                Equipo {getSortIcon('name')}
              </th>
              <th className="font-normal text-right pr-4 cursor-pointer group hidden sm:table-cell" onClick={() => requestSort('pj')}>
                PJ {getSortIcon('pj')}
              </th>
              <th className="font-normal text-right pr-4 cursor-pointer group" onClick={() => requestSort('xg')}>
                xG {getSortIcon('xg')}
              </th>
              <th className="font-normal text-right pr-4 cursor-pointer group" onClick={() => requestSort('goals')}>
                Goles {getSortIcon('goals')}
              </th>
              <th className="font-normal text-right pr-4 cursor-pointer group min-w-[120px]" onClick={() => requestSort('diff')}>
                G−xG {getSortIcon('diff')}
              </th>
              <th className="font-normal text-right pr-4 cursor-pointer group" onClick={() => requestSort('xg90')}>
                xG/90 {getSortIcon('xg90')}
              </th>
              <th className="font-normal text-right pr-4 cursor-pointer group hidden sm:table-cell" onClick={() => requestSort('xga')}>
                xGA {getSortIcon('xga')}
              </th>
              <th className="font-normal text-right pr-4 cursor-pointer group hidden sm:table-cell" onClick={() => requestSort('ga')}>
                G.Enc {getSortIcon('ga')}
              </th>
              <th className="font-normal text-right pr-4 cursor-pointer group" onClick={() => requestSort('diffXg')}>
                Dif.xG {getSortIcon('diffXg')}
              </th>
            </tr>
          </thead>
          <tbody>
            {displayedData.map((team) => {
              const maxScale = Math.max(0.1, team.maxDiff);
              const isPos = team.diff > 0;
              const barWidth = (Math.abs(team.diff) / maxScale) * 50; // máx 50% hacia cada lado desde el centro
              
              return (
                <tr
                  key={team.id}
                  className={`row transition-colors ${activeTeam === team.id ? "on bg-white/[0.04]" : ""}`}
                  data-t={team.id}
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                  onMouseEnter={() => onHoverTeam(team.id)}
                  onMouseLeave={() => onHoverTeam(null)}
                >
                  <td className="py-2.5 font-mono text-slate-400">
                    {team.rank}
                  </td>
                  <td className="font-semibold text-white truncate max-w-[90px] md:max-w-[120px]">{team.name}</td>
                  <td className="text-right pr-4 font-mono text-slate-300 hidden sm:table-cell">{team.pj}</td>
                  <td className="text-right pr-4 font-mono text-slate-200">{team.xg.toFixed(1)}</td>
                  <td className="text-right pr-4 font-mono font-medium text-white">{team.goals}</td>
                  <td className="text-right pr-4 py-2 font-mono">
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className="font-bold text-xs sm:text-sm tabular-nums"
                        style={{ color: team.diff > 0 ? "#10b981" : (team.diff < 0 ? "#f43f5e" : "var(--mut)") }}
                      >
                        {team.diff > 0 ? "+" : (team.diff < 0 ? "−" : "")}{Math.abs(team.diff).toFixed(1)}
                      </span>
                      {/* Barra horizontal divergente centrada en 0 */}
                      <div className="relative h-1.5 w-24 sm:w-28 rounded-full bg-white/10 overflow-hidden">
                        {/* Marcador central en 0 */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-slate-400 z-10" />
                        
                        {/* Positivo: verde bg-emerald-500 creciendo a la derecha */}
                        {isPos && (
                          <div
                            className="absolute h-full rounded-r-full bg-emerald-500 shadow-[0_0_6px_#10b981]"
                            style={{
                              left: "50%",
                              width: `${barWidth}%`,
                            }}
                          />
                        )}
                        
                        {/* Negativo: rojo bg-rose-500 creciendo a la izquierda */}
                        {!isPos && team.diff < 0 && (
                          <div
                            className="absolute h-full rounded-l-full bg-rose-500 shadow-[0_0_6px_#f43f5e]"
                            style={{
                              right: "50%",
                              width: `${barWidth}%`,
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="text-right pr-4 font-mono text-slate-300">{team.xg90.toFixed(2)}</td>
                  <td className="text-right pr-4 font-mono text-slate-400 hidden sm:table-cell">{team.xga.toFixed(1)}</td>
                  <td className="text-right pr-4 font-mono text-slate-400 hidden sm:table-cell">{team.ga}</td>
                  <td className="text-right pr-4 font-mono font-semibold" style={{ color: team.diffXg > 0 ? "var(--em)" : (team.diffXg < 0 ? "var(--or)" : "var(--mut)") }}>
                    {team.diffXg > 0 ? "+" : (team.diffXg < 0 ? "−" : "")}{Math.abs(team.diffXg).toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

"use client";

import React, { useState, useMemo } from "react";

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
  const [searchTerm, setSearchTerm] = useState("");

  const sortedData = useMemo(() => {
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

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return sortedData;
    const q = searchTerm.toLowerCase().trim();
    return sortedData.filter(t => t.name.toLowerCase().includes(q));
  }, [sortedData, searchTerm]);

  // Default Top 8 or all 20 teams (or all filtered if searching)
  const displayedData = showAll || searchTerm.trim() !== "" ? filteredData : filteredData.slice(0, 8);

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
    <section className="glass-card md:col-span-8 flex flex-col h-[600px] p-6 rounded-2xl transition-all duration-300 hover:-translate-y-0.5">
      {/* Fixed Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-white/10 shrink-0">
        <div>
          <div className="lbl font-semibold">Clasificación analítica</div>
          <div className="font-bold text-base text-white mt-0.5">Eficiencia y Desempeño Ofensivo/Defensivo</div>
        </div>
        
        <div className="flex items-center gap-2.5">
          {/* Quick Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar club..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-28 sm:w-36 bg-slate-950/70 border border-white/10 rounded-lg text-xs px-2.5 py-1.5 text-slate-200 placeholder:text-slate-500 outline-none focus:border-emerald-500/50 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
              >
                ×
              </button>
            )}
          </div>

          <span className="text-xs font-mono text-slate-400 hidden sm:inline">
            J{data[0]?.pj || 0}
          </span>

          <button 
            onClick={() => {
              setShowAll(!showAll);
              if (searchTerm) setSearchTerm("");
            }}
            className="text-xs font-mono font-medium px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 transition-colors text-slate-300 shrink-0"
          >
            {showAll ? "Top 8" : `Ver los ${data.length} equipos`}
          </button>
        </div>
      </div>

      {/* Scrollable Table Area with Sticky Thead */}
      <div className="overflow-x-auto overflow-y-auto flex-1 pr-1 custom-scrollbar">
        <table className="w-full text-xs lg:text-sm font-sans" id="tb">
          <thead className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md">
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
            {displayedData.length === 0 && (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-500 font-mono">
                  No se encontraron equipos que coincidan con "{searchTerm}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

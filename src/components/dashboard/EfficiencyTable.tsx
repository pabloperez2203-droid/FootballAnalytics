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
    <section className="card md:col-span-8 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="lbl">Clasificación analítica</div>
          <div className="font-semibold mt-1">Eficiencia y Desempeño Ofensivo/Defensivo</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: "var(--mut)" }}>
            Jornada {data[0]?.pj || 0}
          </span>
          <button 
            onClick={() => setShowAll(!showAll)}
            className="text-xs px-3 py-1 rounded-md bg-[#1a2024] hover:bg-[#252b30] border border-[var(--line)] transition-colors"
          >
            {showAll ? "Ver Top 5" : "Ver todos"}
          </button>
        </div>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-xs lg:text-sm" id="tb">
          <thead>
            <tr className="lbl text-left border-b border-[var(--line)]">
              <th className="py-2 font-normal w-6 cursor-pointer group" onClick={() => requestSort('rank')}>
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
              <th className="font-normal text-right pr-4 cursor-pointer group" onClick={() => requestSort('diff')}>
                G−xG {getSortIcon('diff')}
              </th>
              <th className="font-normal w-16 md:w-24 text-center">Efic.</th>
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
              const barWidth = (Math.abs(team.diff) / maxScale) * 50; // max 50% width
              
              return (
                <tr
                  key={team.id}
                  className={`row ${activeTeam === team.id ? "on" : ""}`}
                  data-t={team.id}
                  style={{ borderBottom: "1px solid var(--line)" }}
                  onMouseEnter={() => onHoverTeam(team.id)}
                  onMouseLeave={() => onHoverTeam(null)}
                >
                  <td className="py-2.5" style={{ color: "var(--mut)" }}>
                    {team.rank}
                  </td>
                  <td className="font-medium truncate max-w-[90px] md:max-w-[120px]">{team.name}</td>
                  <td className="text-right pr-4 hidden sm:table-cell">{team.pj}</td>
                  <td className="text-right pr-4">{team.xg.toFixed(1)}</td>
                  <td className="text-right pr-4">{team.goals}</td>
                  <td
                    className="text-right pr-4 font-semibold"
                    style={{ color: team.diff > 0 ? "var(--em)" : (team.diff < 0 ? "var(--or)" : "var(--mut)") }}
                  >
                    {team.diff > 0 ? "+" : (team.diff < 0 ? "−" : "")}
                    {Math.abs(team.diff).toFixed(1)}
                  </td>
                  <td className="px-1 md:px-2">
                    <div className="relative h-1.5 w-full rounded-full" style={{ background: "#1a2024" }}>
                      {/* Zero line marker */}
                      <div className="absolute left-1/2 top-[-2px] bottom-[-2px] w-[1px] bg-slate-500 z-10" />
                      
                      {/* Positive bar grows right from 50% */}
                      {isPos && (
                        <div
                          className="absolute h-full rounded-r-full"
                          style={{
                            left: "50%",
                            width: `${barWidth}%`,
                            background: "var(--em)",
                          }}
                        />
                      )}
                      
                      {/* Negative bar grows left from 50% */}
                      {!isPos && team.diff < 0 && (
                        <div
                          className="absolute h-full rounded-l-full"
                          style={{
                            right: "50%",
                            width: `${barWidth}%`,
                            background: "var(--or)",
                          }}
                        />
                      )}
                    </div>
                  </td>
                  <td className="text-right pr-4">{team.xg90.toFixed(2)}</td>
                  <td className="text-right pr-4 hidden sm:table-cell">{team.xga.toFixed(1)}</td>
                  <td className="text-right pr-4 hidden sm:table-cell">{team.ga}</td>
                  <td className="text-right pr-4" style={{ color: team.diffXg > 0 ? "var(--em)" : (team.diffXg < 0 ? "var(--or)" : "var(--mut)") }}>
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

import React from 'react';

interface ShotTimelineTableProps {
  shots: any[];
  hoveredShotId?: string | number | null;
  onHoverShot?: (id: string | number | null) => void;
}

export default function ShotTimelineTable({ shots, hoveredShotId, onHoverShot }: ShotTimelineTableProps) {
   const sortedShots = [...shots].sort((a, b) => a.min - b.min);

   return (
      <div className="glass-card rounded-2xl p-6 h-full flex flex-col transition-all duration-300 hover:-translate-y-0.5">
         <div className="lbl font-semibold mb-4">Cronología de tiros</div>
         <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
            <table className="w-full text-sm text-left">
               <thead className="text-xs font-mono text-slate-400 bg-slate-950/80 sticky top-0 backdrop-blur-sm border-b border-white/10">
                  <tr>
                     <th className="py-2.5 px-3 font-medium">Min</th>
                     <th className="py-2.5 px-3 font-medium">Jugador</th>
                     <th className="py-2.5 px-3 font-medium text-right">xG</th>
                     <th className="py-2.5 px-3 font-medium text-center">Resultado</th>
                  </tr>
               </thead>
               <tbody>
                  {sortedShots.map((s, i) => {
                     const isActive = hoveredShotId != null && String(hoveredShotId) === String(s.id);
                     return (
                        <tr
                           key={s.id || i}
                           onMouseEnter={() => onHoverShot?.(s.id)}
                           onMouseLeave={() => onHoverShot?.(null)}
                           className={`border-b border-white/5 transition-all duration-150 cursor-pointer ${
                              isActive
                                 ? 'bg-emerald-500/15 border-l-4 border-l-emerald-400 text-white font-medium'
                                 : 'hover:bg-white/[0.04]'
                           }`}
                        >
                           <td className="py-2.5 px-3 font-mono text-slate-400 text-xs">{s.min}'</td>
                           <td className="py-2.5 px-3 font-medium text-white text-xs sm:text-sm">
                              <div className="flex items-center gap-2">
                                 <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ background: s.team === 'home' ? 'var(--em)' : 'var(--or)' }}
                                 ></span>
                                 <span className="truncate">{s.player}</span>
                              </div>
                           </td>
                           <td className="py-2.5 px-3 font-mono text-right text-xs sm:text-sm tabular-nums text-slate-300 font-semibold">
                              {Number(s.xg).toFixed(2)}
                           </td>
                           <td className="py-2.5 px-3 text-center">
                              <span
                                 className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                                    s.result === 'Gol'
                                       ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                       : 'bg-white/5 text-slate-400 border border-white/5'
                                 }`}
                              >
                                 {s.result}
                              </span>
                           </td>
                        </tr>
                     );
                  })}
               </tbody>
            </table>
         </div>
      </div>
   );
}


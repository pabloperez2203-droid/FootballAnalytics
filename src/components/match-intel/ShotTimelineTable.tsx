import React from 'react';

export default function ShotTimelineTable({ shots }: { shots: any[] }) {
   return (
      <div className="card glow h-full flex flex-col">
         <div className="lbl mb-4">Cronología de tiros</div>
         <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
            <table className="w-full text-sm text-left">
               <thead className="text-xs text-slate-400 bg-[#13181b] sticky top-0">
                  <tr>
                     <th className="py-2 px-3 font-medium">Min</th>
                     <th className="py-2 px-3 font-medium">Jugador</th>
                     <th className="py-2 px-3 font-medium">xG</th>
                     <th className="py-2 px-3 font-medium">Resultado</th>
                  </tr>
               </thead>
               <tbody>
                  {shots.sort((a, b) => a.min - b.min).map((s, i) => (
                     <tr key={i} className="border-b border-[var(--line)] last:border-0 hover:bg-slate-800/30">
                        <td className="py-2 px-3 font-mono text-slate-400">{s.min}'</td>
                        <td className="py-2 px-3">
                           <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.team === 'home' ? 'var(--em)' : 'var(--or)' }}></span>
                              {s.player}
                           </div>
                        </td>
                        <td className="py-2 px-3 font-mono">{s.xg.toFixed(2)}</td>
                        <td className="py-2 px-3">
                           <span className={`px-2 py-0.5 rounded text-[10px] ${s.result === 'Gol' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                              {s.result}
                           </span>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
   );
}

import React from 'react';

export default function StatsComparison({ stats }: { stats: any }) {
  const metrics = [
     { label: 'Tiros', home: stats.home.shots, away: stats.away.shots },
     { label: 'xG Total', home: stats.home.xg, away: stats.away.xg },
     { label: 'xG por Tiro', home: stats.home.xg_per_shot, away: stats.away.xg_per_shot }
  ];

  return (
    <div className="card glow h-full flex flex-col">
      <div className="lbl mb-4">Comparativa</div>
      <div className="flex flex-col gap-6 flex-1 justify-center">
         {metrics.map((m, i) => {
            const max = Math.max(m.home, m.away, 0.1);
            const wHome = (m.home / max) * 100;
            const wAway = (m.away / max) * 100;

            return (
               <div key={i} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs text-slate-400">
                     <span>{typeof m.home === 'number' && m.home % 1 !== 0 ? m.home.toFixed(2) : m.home}</span>
                     <span className="font-medium text-slate-200">{m.label}</span>
                     <span>{typeof m.away === 'number' && m.away % 1 !== 0 ? m.away.toFixed(2) : m.away}</span>
                  </div>
                  <div className="flex items-center gap-1 h-2 w-full">
                     <div className="flex-1 flex justify-end h-full bg-[#1a2024] rounded-l-full overflow-hidden">
                        <div style={{ width: `${wHome}%`, background: 'var(--em)' }} className="h-full rounded-l-full"></div>
                     </div>
                     <div className="w-px h-3 bg-slate-700"></div>
                     <div className="flex-1 flex justify-start h-full bg-[#1a2024] rounded-r-full overflow-hidden">
                        <div style={{ width: `${wAway}%`, background: 'var(--or)' }} className="h-full rounded-r-full"></div>
                     </div>
                  </div>
               </div>
            )
         })}
      </div>
    </div>
  );
}

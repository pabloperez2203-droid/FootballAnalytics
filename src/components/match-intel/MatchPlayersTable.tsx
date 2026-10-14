import React from 'react';

export default function MatchPlayersTable({ players }: { players: any[] }) {
  return (
    <div className="card glow h-full flex flex-col">
      <div className="lbl mb-4">Jugadores del partido</div>
      <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[300px]">
        <table className="w-full text-sm text-left">
           <thead className="text-xs text-slate-400 bg-[#13181b] sticky top-0">
              <tr>
                 <th className="py-2 px-3 font-medium">Jugador</th>
                 <th className="py-2 px-3 font-medium text-center">Min</th>
                 <th className="py-2 px-3 font-medium text-center">Tiros</th>
                 <th className="py-2 px-3 font-medium text-center">xG</th>
                 <th className="py-2 px-3 font-medium text-center">Goles</th>
              </tr>
           </thead>
           <tbody>
              {players.sort((a,b) => b.xg - a.xg).map((p, i) => (
                 <tr key={i} className="border-b border-[var(--line)] last:border-0 hover:bg-slate-800/30">
                    <td className="py-2 px-3">
                       <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.team === 'home' ? 'var(--em)' : 'var(--or)' }}></span>
                          {p.name}
                       </div>
                    </td>
                    <td className="py-2 px-3 text-center text-slate-400">{p.mins}'</td>
                    <td className="py-2 px-3 text-center">{p.shots}</td>
                    <td className="py-2 px-3 text-center font-mono text-slate-200">{p.xg.toFixed(2)}</td>
                    <td className="py-2 px-3 text-center font-semibold">{p.goals > 0 ? <span className="text-emerald-400">{p.goals}</span> : p.goals}</td>
                 </tr>
              ))}
           </tbody>
        </table>
      </div>
    </div>
  );
}

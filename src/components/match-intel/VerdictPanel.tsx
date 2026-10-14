import React from 'react';

export default function VerdictPanel({ verdict }: { verdict: any }) {
  return (
    <div className="card glow h-full flex flex-col">
      <div className="lbl mb-4">Veredicto y claves</div>
      <div className="flex flex-col gap-3 flex-1 justify-center">
         <div className="bg-[#1a2024] p-3 rounded-lg border border-[var(--line)]">
            <div className="text-xs text-slate-400 mb-1">Probabilidad de victoria (según xG)</div>
            <div className="flex h-2 rounded-full overflow-hidden w-full">
               <div style={{ width: `${verdict.win_probability.home}%`, background: 'var(--em)' }}></div>
               <div style={{ width: `${verdict.win_probability.draw}%`, background: '#5a6368' }}></div>
               <div style={{ width: `${verdict.win_probability.away}%`, background: 'var(--or)' }}></div>
            </div>
            <div className="flex justify-between text-[10px] mt-1 font-mono">
               <span style={{ color: 'var(--em)' }}>{verdict.win_probability.home}% Local</span>
               <span className="text-slate-400">{verdict.win_probability.draw}% Empate</span>
               <span style={{ color: 'var(--or)' }}>{verdict.win_probability.away}% Visita</span>
            </div>
         </div>

         <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
            <span className="text-xs text-slate-400">Mejor ocasión</span>
            <span className="text-sm font-medium">{verdict.best_chance}</span>
         </div>
         <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
            <span className="text-xs text-slate-400">Jugador peligroso</span>
            <span className="text-sm font-medium">{verdict.most_dangerous}</span>
         </div>
         <div className="flex items-center justify-between pb-1">
            <span className="text-xs text-slate-400">Mayor sorpresa</span>
            <span className="text-sm font-medium text-amber-400">{verdict.biggest_surprise}</span>
         </div>
      </div>
    </div>
  );
}

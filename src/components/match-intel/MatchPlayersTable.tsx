"use client";

import React, { useState } from 'react';

function PlayerAvatarItem({ name, photo, isHome }: { name: string; photo?: string; isHome: boolean }) {
  const [imgError, setImgError] = useState(false);
  const color = isHome ? 'var(--em)' : 'var(--or)';
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div 
        className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[9px] text-white overflow-hidden bg-slate-900 border shrink-0"
        style={{ borderColor: `${color}80` }}
      >
        {photo && !imgError ? (
          <img
            src={photo}
            alt={name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover object-top scale-110"
          />
        ) : (
          <span style={{ color }}>{initials}</span>
        )}
      </div>
      <span className="truncate font-medium text-slate-200">{name}</span>
    </div>
  );
}

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
                       <PlayerAvatarItem
                         name={p.name}
                         photo={p.photo}
                         isHome={p.team === 'home'}
                       />
                    </td>
                    <td className="py-2 px-3 text-center text-slate-400 font-mono text-xs">{p.mins}'</td>
                    <td className="py-2 px-3 text-center font-mono text-xs">{p.shots}</td>
                    <td className="py-2 px-3 text-center font-mono text-xs text-slate-200">{p.xg.toFixed(2)}</td>
                    <td className="py-2 px-3 text-center font-semibold font-mono text-xs">
                      {p.goals > 0 ? <span className="text-emerald-400 font-bold">{p.goals}</span> : p.goals}
                    </td>
                 </tr>
              ))}
           </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";
import React, { useState, useEffect } from 'react';

const getDepth = (pos: string) => {
  if (pos === 'GK') return 0;
  if (['DC', 'DL', 'DR'].includes(pos)) return 1;
  if (['DMC', 'DML', 'DMR'].includes(pos)) return 2;
  if (['MC', 'ML', 'MR'].includes(pos)) return 3;
  if (['AMC', 'AML', 'AMR'].includes(pos)) return 4;
  if (['FW', 'FWL', 'FWR'].includes(pos)) return 5;
  return 3;
};

interface Player {
  id: string;
  player_id: string;
  player: string;
  position: string;
  positionOrder: string;
  time: string;
  roster_in: string;
  roster_out: string;
  goals: string;
  own_goals: string;
  assists: string;
  shots: string;
  xG: string;
  xA: string;
  key_passes: string;
  xGChain: string;
  xGBuildup: string;
  yellow_card: string;
  red_card: string;
  photo?: string;
}

const PlayerAvatar = ({ 
  player, 
  team, 
  photoUrl, 
  isOpen, 
  isDimmed,
  onToggle
}: { 
  player: Player, 
  team: 'home' | 'away', 
  photoUrl?: string, 
  isOpen: boolean, 
  isDimmed: boolean,
  onToggle: () => void, 
}) => {
  const [imgError, setImgError] = useState(false);
  const isHome = team === 'home';
  const color = isHome ? 'var(--em)' : 'var(--or)';
  const initials = player.player.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const lastName = player.player.split(' ').pop();

  useEffect(() => {
    setImgError(false);
  }, [photoUrl]);

  const hasValidPhoto = Boolean(photoUrl && !imgError);

  return (
    <button 
      onClick={onToggle}
      className={`flex flex-col items-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 p-0.5 relative transition-all duration-300 ${isDimmed ? 'opacity-20 grayscale-[50%]' : 'opacity-100'}`}
      aria-label={`${player.player}, ${player.position}`}
      style={{ minHeight: 0 }}
    >
      {hasValidPhoto ? (
        /* Cara recortada directamente sobre el campo, sin círculo ni marco redondo */
        <div 
          className={`relative z-10 transition-all duration-300 ${isOpen ? 'scale-125 -translate-y-1' : 'group-hover:scale-115 group-hover:-translate-y-0.5'}`}
        >
          <img 
            src={photoUrl} 
            alt={player.player} 
            onError={() => setImgError(true)}
            className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain object-bottom pointer-events-none select-none" 
            style={{
              filter: isOpen 
                ? `drop-shadow(0 0 10px ${color}) drop-shadow(0 4px 6px rgba(0,0,0,0.9))` 
                : `drop-shadow(0 3px 5px rgba(0,0,0,0.85))`
            }}
          />
        </div>
      ) : (
        /* Fallback solo si no hay foto disponible */
        <div 
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold text-[9px] sm:text-[10px] md:text-xs text-white shadow-lg z-10 transition-all duration-300 shrink-0 ${isOpen ? 'scale-125 ring-2 ring-white/50' : 'group-hover:scale-110'} bg-[#13181b]/95 border`}
          style={{ 
            borderColor: color, 
            boxShadow: isOpen ? `0 0 15px ${color}80` : ''
          }}
        >
          <span style={{ color }}>{initials}</span>
        </div>
      )}

      {/* Etiqueta con el apellido */}
      <div 
        className={`mt-0.5 px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] md:text-[10px] font-medium max-w-[64px] truncate text-center leading-tight transition-all duration-300 z-10 ${
          isOpen 
            ? 'bg-slate-900 text-white border shadow-md' 
            : 'bg-black/75 text-slate-200 border border-white/10 group-hover:bg-black/90 group-hover:text-white'
        }`}
        style={{
          borderColor: isOpen ? color : undefined
        }}
      >
        {lastName}
      </div>
    </button>
  );
};

export default function MatchLineups({ rosters, matchData, playersStats }: { rosters: any, matchData: any, playersStats?: any }) {
  const [openPlayerId, setOpenPlayerId] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Record<string, any>>({});

  useEffect(() => {
    // Load consolidated player photos with fallback
    fetch('/data/player_photos.json')
      .then(res => res.json())
      .then(data => setPhotos(data))
      .catch(() => {
        fetch('/data/players_photos.json')
          .then(res => res.json())
          .then(data => setPhotos(data))
          .catch(err => console.error("Could not load player photos", err));
      });
  }, []);

  if (!rosters || !rosters.h || !rosters.a) {
    return (
      <div className="card glow h-full flex items-center justify-center min-h-[300px]">
        <p className="text-slate-500">Alineaciones no disponibles.</p>
      </div>
    );
  }

  // Parse roster and deduplicate by player name to handle corrupted data
  const parseRoster = (r: any) => {
    const players = Object.values(r).map((p: any) => p as Player);
    const seen = new Set<string>();
    return players.filter(p => {
      if (seen.has(p.player)) return false;
      seen.add(p.player);
      return true;
    });
  };
  const homePlayers = parseRoster(rosters.h);
  const awayPlayers = parseRoster(rosters.a);
  const allPlayers = [...homePlayers, ...awayPlayers];

  const maxStats = {
    xG: Math.max(...allPlayers.map(p => Number(p.xG) || 0)),
    xA: Math.max(...allPlayers.map(p => Number(p.xA) || 0)),
    xGChain: Math.max(...allPlayers.map(p => Number(p.xGChain) || 0)),
    xGBuildup: Math.max(...allPlayers.map(p => Number(p.xGBuildup) || 0)),
    key_passes: Math.max(...allPlayers.map(p => Number(p.key_passes) || 0)),
  };

  const homeStarters = homePlayers.filter(p => p.position !== 'Sub');
  const awayStarters = awayPlayers.filter(p => p.position !== 'Sub');

  interface PositionedPlayer {
    player: Player;
    team: 'home' | 'away';
    x: number;
    y: number;
  }

  const computePositions = (starters: Player[], isAway: boolean): PositionedPlayer[] => {
    const team: 'home' | 'away' = isAway ? 'away' : 'home';
    const gks = starters.filter(p => p.position === 'GK');
    const outfield = starters.filter(p => p.position !== 'GK');

    const result: PositionedPlayer[] = [];

    // 1. Goalkeeper: Fixed position (Home: 7%, Away: 93%)
    const gkX = isAway ? 93 : 7;
    gks.forEach((gk, idx) => {
      const y = gks.length === 1 ? 50 : ((idx + 1) / (gks.length + 1)) * 100;
      result.push({ player: gk, team, x: gkX, y });
    });

    // 2. Outfield players: Equitably distributed within bounded range
    const groups: { [key: number]: Player[] } = {};
    outfield.forEach(p => {
      const d = getDepth(p.position);
      if (!groups[d]) groups[d] = [];
      groups[d].push(p);
    });

    const depthKeys = Object.keys(groups).map(Number).sort((a, b) => a - b);
    const numLines = depthKeys.length;

    depthKeys.forEach((d, lineIdx) => {
      // Home: 18% (defenders) to 45% (forwards)
      // Away: 82% (defenders) to 55% (forwards)
      let lineX: number;
      if (!isAway) {
        lineX = numLines <= 1 ? 31.5 : 18 + (lineIdx / (numLines - 1)) * (45 - 18);
      } else {
        lineX = numLines <= 1 ? 68.5 : 82 - (lineIdx / (numLines - 1)) * (82 - 55);
      }

      const linePlayers = [...groups[d]].sort((a, b) => {
        const orderA = Number(a.positionOrder) || 0;
        const orderB = Number(b.positionOrder) || 0;
        return isAway ? orderB - orderA : orderA - orderB;
      });

      const count = linePlayers.length;
      linePlayers.forEach((player, pIdx) => {
        const y = count === 1 ? 50 : ((pIdx + 1) / (count + 1)) * 100;
        result.push({ player, team, x: lineX, y });
      });
    });

    return result;
  };

  const homePositioned = computePositions(homeStarters, false);
  const awayPositioned = computePositions(awayStarters, true);
  const allPositioned = [...homePositioned, ...awayPositioned];

  const calculateMinuteIn = (players: Player[]) => {
    const minMap: Record<string, number> = {};
    players.filter(p => p.position !== 'Sub').forEach(p => { minMap[p.id] = 0; });
    
    let changed = true;
    while(changed) {
      changed = false;
      players.filter(p => p.position === 'Sub' && p.roster_out !== '0').forEach(p => {
        if (minMap[p.id] === undefined && minMap[p.roster_out] !== undefined) {
          const replaced = players.find(x => x.id === p.roster_out);
          minMap[p.id] = minMap[p.roster_out] + Number(replaced?.time || 0);
          changed = true;
        }
      });
    }
    return minMap;
  };

  const homeMinMap = calculateMinuteIn(homePlayers);
  const awayMinMap = calculateMinuteIn(awayPlayers);

  const subsIn = (players: Player[], minMap: Record<string, number>) =>
    players
      .filter((p) => p.position === 'Sub' && p.roster_out !== '0')
      .map((sub) => {
        const replaced = players.find((p) => p.id === sub.roster_out);
        const minIn = minMap[sub.id] || (90 - Number(sub.time));
        return { ...sub, replacedName: replaced ? replaced.player : '—', minIn };
      })
      .sort((a, b) => a.minIn - b.minIn);

  const homeSubsIn = subsIn(homePlayers, homeMinMap);
  const awaySubsIn = subsIn(awayPlayers, awayMinMap);
  const isAnyOpen = openPlayerId !== null;

  const openPlayer = allPlayers.find(p => p.player_id === openPlayerId);
  const openPlayerTeam = openPlayer ? (homePlayers.find(p => p.player_id === openPlayerId) ? 'home' : 'away') : null;

  useEffect(() => {
    if (!isAnyOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenPlayerId(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isAnyOpen]);

  // Render player stats bar
  const renderStatBar = (label: string, val: number, max: number, color: string, decimals: number = 2) => {
    if (max === 0 && val === 0) return null;
    const pct = max > 0 ? Math.min(100, (val / max) * 100) : 0;
    const isLeader = val === max && max > 0;
    return (
      <div className="mb-2.5 last:mb-0">
        <div className="flex justify-between items-end mb-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-300">{label}</span>
            {isLeader && (
              <span className="text-[8px] font-bold px-1 rounded-sm bg-emerald-500/20 text-emerald-400 uppercase tracking-wide">
                Líder
              </span>
            )}
          </div>
          <span className="text-[11px] font-mono font-semibold text-white">{decimals === 0 ? val : val.toFixed(decimals)}</span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500" 
            style={{ width: `${pct}%`, backgroundColor: color }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="card glow h-full flex flex-col min-h-[400px]">
      <div className="lbl mb-4 px-1">Alineaciones</div>

      {/* Horizontal Pitch */}
      <div className={`relative w-full border-2 border-slate-700/50 rounded-lg mb-4 transition-colors duration-500 ${isAnyOpen ? 'bg-[#050709]' : 'bg-[#0d1114]'}`}
        style={{ aspectRatio: '16 / 10' }}
      >
        
        {/* Inner container */}
        <div className="absolute inset-0 rounded-[6px]">
          {/* Pitch Lines Background */}
          <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${isAnyOpen ? 'opacity-10' : 'opacity-100'}`}>
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-700/40 -translate-x-1/2"></div>
            <div className="absolute top-1/2 left-1/2 w-24 h-24 sm:w-28 sm:h-28 border border-slate-700/40 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-slate-700/50 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            {/* Penalty Areas */}
            <div className="absolute top-1/2 left-0 w-[15%] h-[45%] border border-l-0 border-slate-700/40 -translate-y-1/2"></div>
            <div className="absolute top-1/2 right-0 w-[15%] h-[45%] border border-r-0 border-slate-700/40 -translate-y-1/2"></div>
            {/* Goal Areas */}
            <div className="absolute top-1/2 left-0 w-[6%] h-[20%] border border-l-0 border-slate-700/40 -translate-y-1/2"></div>
            <div className="absolute top-1/2 right-0 w-[6%] h-[20%] border border-r-0 border-slate-700/40 -translate-y-1/2"></div>
          </div>

          {/* Absolute Positioned Players */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            {allPositioned.map(({ player, team, x, y }) => {
              const teamActual = team === 'home' ? matchData.home_team : matchData.away_team;
              const photoUrl = player.photo || 
                photos[`${teamActual}|${player.player}`] || 
                photos[player.player] || 
                photos[player.player_id]?.ruta_local || 
                photos[player.player_id]?.url ||
                (photos._by_id && photos._by_id[player.player_id]?.url);

              return (
                <div
                  key={player.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <PlayerAvatar
                    player={player}
                    team={team}
                    photoUrl={photoUrl}
                    isOpen={openPlayerId === player.player_id}
                    isDimmed={isAnyOpen && openPlayerId !== player.player_id}
                    onToggle={() => setOpenPlayerId(openPlayerId === player.player_id ? null : player.player_id)}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Overlay clicking to close popup */}
        {isAnyOpen && (
          <div 
            className="absolute inset-0 z-40 cursor-pointer" 
            onClick={() => setOpenPlayerId(null)}
          ></div>
        )}

        {/* Centered Popup */}
        {openPlayer && openPlayerTeam && (() => {
          const openTeamName = openPlayerTeam === 'home' ? matchData.home_team : matchData.away_team;
          const openPhoto = openPlayer.photo || 
            photos[`${openTeamName}|${openPlayer.player}`] || 
            photos[openPlayer.player] || 
            photos[openPlayer.player_id]?.ruta_local || 
            photos[openPlayer.player_id]?.url ||
            (photos._by_id && photos._by_id[openPlayer.player_id]?.url);

          return (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[280px]">
              <div 
                className="bg-[#0d1114] rounded-xl shadow-2xl animate-fade-in pointer-events-auto"
                style={{
                  border: `1px solid ${openPlayerTeam === 'home' ? 'var(--em)' : 'var(--or)'}60`,
                  boxShadow: `0 20px 40px -5px rgba(0,0,0,0.8), 0 0 25px ${openPlayerTeam === 'home' ? 'var(--em)' : 'var(--or)'}30`
                }}
              >
                 {/* Header */}
                 <div className="p-3 border-b border-slate-800 flex items-start justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[var(--color)] to-transparent opacity-10 pointer-events-none rounded-bl-full" style={{'--color': openPlayerTeam === 'home' ? 'var(--em)' : 'var(--or)'} as any}></div>
                    
                    <div className="flex items-center gap-3 relative z-10">
                       <div className="w-12 h-12 flex items-center justify-center shrink-0">
                          {openPhoto ? (
                            <img 
                              src={openPhoto} 
                              alt={openPlayer.player} 
                              className="w-full h-full object-contain object-bottom" 
                              style={{ filter: `drop-shadow(0 2px 8px ${openPlayerTeam === 'home' ? 'var(--em)' : 'var(--or)'}80)` }}
                            />
                          ) : (
                            <div 
                              className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs text-white bg-slate-900 border"
                              style={{ borderColor: openPlayerTeam === 'home' ? 'var(--em)' : 'var(--or)' }}
                            >
                              {openPlayer.player.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                          )}
                       </div>
                       <div>
                          <h4 className="font-bold text-sm text-white leading-tight mb-0.5 pr-4">{openPlayer.player}</h4>
                          <div className="flex items-center text-[9px] text-slate-400">
                             <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{background: openPlayerTeam === 'home' ? 'var(--em)' : 'var(--or)'}}></span>
                             {openPlayerTeam === 'home' ? matchData.home_team : matchData.away_team} • {openPlayer.position} • {openPlayer.time}'
                          </div>
                       </div>
                    </div>
                    <button onClick={() => setOpenPlayerId(null)} className="text-slate-500 hover:text-white absolute top-3 right-3 text-lg leading-none z-20">×</button>
                 </div>

               {/* Top Stats */}
               <div className="p-3 grid grid-cols-3 gap-2">
                  <div className="bg-[#181f24] rounded-lg p-2 border border-slate-800/50">
                     <div className="text-[9px] text-slate-400 mb-0.5">Goles</div>
                     <div className="font-bold text-sm">{openPlayer.goals}</div>
                  </div>
                  <div className="bg-[#181f24] rounded-lg p-2 border border-slate-800/50">
                     <div className="text-[9px] text-slate-400 mb-0.5">Asist.</div>
                     <div className="font-bold text-sm">{openPlayer.assists}</div>
                  </div>
                  <div className="bg-[#181f24] rounded-lg p-2 border border-slate-800/50">
                     <div className="text-[9px] text-slate-400 mb-0.5">Tiros</div>
                     <div className="font-bold text-sm">{openPlayer.shots}</div>
                  </div>
               </div>

               {/* Advanced Stats */}
               <div className="px-3 pb-3">
                  <div className="text-[8px] tracking-wider text-slate-500 font-bold uppercase mb-3">Frente al máximo del partido</div>
                  
                  {renderStatBar("xG", Number(openPlayer.xG) || 0, maxStats.xG, openPlayerTeam === 'home' ? 'var(--em)' : 'var(--or)', 2)}
                  {renderStatBar("xA", Number(openPlayer.xA) || 0, maxStats.xA, openPlayerTeam === 'home' ? 'var(--em)' : 'var(--or)', 2)}
                  {renderStatBar("xGChain", Number(openPlayer.xGChain) || 0, maxStats.xGChain, openPlayerTeam === 'home' ? 'var(--em)' : 'var(--or)', 2)}
                  {renderStatBar("xGBuildup", Number(openPlayer.xGBuildup) || 0, maxStats.xGBuildup, openPlayerTeam === 'home' ? 'var(--em)' : 'var(--or)', 2)}
                  {renderStatBar("Pases clave", Number(openPlayer.key_passes) || 0, maxStats.key_passes, openPlayerTeam === 'home' ? 'var(--em)' : 'var(--or)', 0)}

                  {(Number(openPlayer.xG)===0 && Number(openPlayer.xA)===0 && Number(openPlayer.xGChain)===0 && Number(openPlayer.xGBuildup)===0 && Number(openPlayer.key_passes)===0) && (
                    <div className="text-xs text-slate-500 italic py-2">Sin métricas avanzadas destacables</div>
                  )}
               </div>

               {/* Footer */}
               <div className="px-3 py-2 border-t border-slate-800 text-[10px] text-slate-400 bg-black/20">
                  {Number(openPlayer.yellow_card) > 0 || Number(openPlayer.red_card) > 0 ? (
                     <div className="flex gap-1.5 items-center">
                       {Number(openPlayer.yellow_card) > 0 && <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 rounded font-bold">🟨 {openPlayer.yellow_card}</span>}
                       {Number(openPlayer.red_card) > 0 && <span className="px-1.5 py-0.5 bg-red-500/20 text-red-500 rounded font-bold">🟥 {openPlayer.red_card}</span>}
                     </div>
                  ) : (
                     <span>Sin tarjetas</span>
                  )}
               </div>
            </div>
          </div>
        )})()}
      </div>
      
      {/* ── Substitutions ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto pt-3 border-t border-[var(--line)]">
        {/* Home subs */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--em)' }} />
            <span className="text-[11px] font-semibold text-slate-300">{matchData.home_team} — Cambios</span>
          </div>
          {homeSubsIn.length > 0 ? (
            <div className="flex flex-col gap-1">
              {homeSubsIn.map((s) => (
                <div key={s.id} className="flex items-center text-[10px] text-slate-400 gap-2 hover:bg-slate-800/30 rounded px-1 -mx-1 py-0.5">
                  <span className="text-emerald-400 font-bold font-mono w-6 text-right shrink-0">{s.minIn}'</span>
                  <span className="text-slate-200 truncate">▲ {s.player}</span>
                  <span className="text-slate-500 truncate">▼ {s.replacedName}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-slate-600">Sin cambios</p>
          )}
        </div>

        {/* Away subs */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--or)' }} />
            <span className="text-[11px] font-semibold text-slate-300">{matchData.away_team} — Cambios</span>
          </div>
          {awaySubsIn.length > 0 ? (
            <div className="flex flex-col gap-1">
              {awaySubsIn.map((s) => (
                <div key={s.id} className="flex items-center text-[10px] text-slate-400 gap-2 hover:bg-slate-800/30 rounded px-1 -mx-1 py-0.5">
                  <span className="text-orange-400 font-bold font-mono w-6 text-right shrink-0">{s.minIn}'</span>
                  <span className="text-slate-200 truncate">▲ {s.player}</span>
                  <span className="text-slate-500 truncate">▼ {s.replacedName}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-slate-600">Sin cambios</p>
          )}
        </div>
      </div>
    </div>
  );
}

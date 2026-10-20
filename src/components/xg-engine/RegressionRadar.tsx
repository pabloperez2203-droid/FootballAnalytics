"use client";

import React, { useState, useMemo } from "react";
import equiposData from "@/data/equipos_xg.json";
import equiposUclData from "@/data/equipos_ucl_xg.json";
import jugadoresData from "@/data/jugadores_xg.json";
import jugadoresUclData from "@/data/jugadores_ucl_xg.json";
import { useCompetition } from "@/stores/filterStore";
import { getTeamCrest, getTeamColor } from "@/utils/crests";

export default function RegressionRadar() {
  const { competition, isUcl } = useCompetition();

  const currentEquipos = isUcl ? equiposUclData : equiposData;
  const currentJugadores = isUcl ? jugadoresUclData : jugadoresData;

  const totalSeasonMatches = isUcl ? 8 : 38;

  // ── 1. Equipos al Límite (Regresión a la Media) ──
  const { overperformers, sleepingGiants } = useMemo(() => {
    const list = [...currentEquipos].map((t) => {
      const matches = Math.max(1, t.matches_played || 1);
      const diffGoals = Number(t.diff_goals_xg || t.goals_for - t.xg_for || 0);

      // Si no hay xpts explícito, estimamos xPTS basado en xG for y xG against
      const realPts = Number(t.pts || (t.goals_for > t.goals_against ? matches * 1.8 : matches * 1.1));
      const expPts = Number(t.expected_points || t.xg_for * 1.1);
      const diffPts = realPts - expPts;

      // Proyección fin de temporada
      const projectedGoals = Math.round(t.goals_for + (t.xg_for / matches) * (totalSeasonMatches - matches));
      const projectedXg = (t.xg_for / matches) * totalSeasonMatches;

      return {
        team: t.team,
        matches,
        goalsFor: t.goals_for,
        xgFor: t.xg_for,
        diffGoals,
        realPts: Math.round(realPts),
        expPts: Number(expPts.toFixed(1)),
        diffPts: Number(diffPts.toFixed(1)),
        projectedGoals,
        projectedXg: Number(projectedXg.toFixed(1)),
        crest: getTeamCrest(t.team),
        color: getTeamColor(t.team),
      };
    });

    // Sobre-rendidores: Mayor exceso de goles (G - xG > 0)
    const over = [...list]
      .filter((t) => t.diffGoals > 0)
      .sort((a, b) => b.diffGoals - a.diffGoals)
      .slice(0, 4);

    // Gigantes Dormidos: Generan más xG del que marcan (G - xG < 0) o mayor déficit
    const under = [...list]
      .filter((t) => t.diffGoals <= 0 || t.diffPts < 0)
      .sort((a, b) => a.diffGoals - b.diffGoals)
      .slice(0, 4);

    return {
      overperformers: over.length > 0 ? over : list.slice(0, 4),
      sleepingGiants: under.length > 0 ? under : list.slice(-4),
    };
  }, [currentEquipos, totalSeasonMatches]);

  // ── 1b. Selector de Pestañas en Móvil para Equipos ──
  const [teamTab, setTeamTab] = useState<"all" | "risk" | "giants">("all");

  // ── 2. Perfiles de Finalización de Jugadores ("Francotiradores vs Cazagoles de Área") ──
  const [playerTab, setPlayerTab] = useState<"cazagoles" | "francotiradores">("cazagoles");

  const { cazagolesList, francotiradoresList } = useMemo(() => {
    const minShots = isUcl ? 2 : 6;

    const validPlayers = (currentJugadores as any[])
      .filter((p) => Number(p.shots || 0) >= minShots)
      .map((p) => {
        const shots = Number(p.shots || 1);
        const goals = Number(p.goals || 0);
        const xg = Number(p.xg || 0);
        const matches = Math.max(1, Number(p.matches || p.games || 1));
        const diff = Number(p.diff_goals_xg ?? goals - xg);
        const xgPerShot = xg / shots;

        // Proyección de goles a fin de temporada
        const projGoals = Math.round(goals + (xg / matches) * (totalSeasonMatches - matches));

        const team = p.team_name || p.team || "Club";

        return {
          name: p.player_name || p.player || "Jugador",
          team,
          position: p.position || "DEL",
          goals,
          xg: Number(xg.toFixed(2)),
          shots,
          diff: Number(diff.toFixed(2)),
          xgPerShot: Number(xgPerShot.toFixed(2)),
          projGoals,
          photo: p.photo,
          crest: getTeamCrest(team),
          color: getTeamColor(team),
        };
      });

    // Cazagoles de Área: Mayor Calidad por Tiro (xG / Shot alto: remates dentro del área chica, alta probabilidad)
    const cazagoles = [...validPlayers]
      .sort((a, b) => b.xgPerShot - a.xgPerShot)
      .slice(0, 5);

    // Francotiradores: Mayor Sobre-rendimiento de Pegada (G - xG alto: superan la expectativa con remates clínicos)
    const francotiradores = [...validPlayers]
      .sort((a, b) => b.diff - a.diff)
      .slice(0, 5);

    return {
      cazagolesList: cazagoles,
      francotiradoresList: francotiradores,
    };
  }, [currentJugadores, isUcl, totalSeasonMatches]);

  return (
    <div className="glass-card interactive-card rounded-2xl p-6 sm:p-8 flex flex-col gap-8 transition-all duration-300">
      {/* ─── Encabezado ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full animate-pulse shadow-md ${
                isUcl ? "bg-cyan-400 shadow-cyan-400/50" : "bg-emerald-400 shadow-emerald-400/50"
              }`}
            />
            <span
              className={`text-xs font-mono font-bold tracking-wider uppercase ${
                isUcl ? "text-cyan-400" : "text-emerald-400"
              }`}
            >
              MÓDULO 3 · REGRESIÓN MATEMÁTICA A LA MEDIA & SCOUTING
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Detector de Espejismos & Oráculo de Temporada
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            La ley matemática de regresión a la media: identifica qué equipos están sobre-rindiendo por encima de su xG real (en riesgo de caída) y qué clubes generadores están a punto de explotar hacia arriba.
          </p>
        </div>

        {/* Badge Proyección */}
        <div className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
          <span>🎯</span>
          <span>Proyección: {totalSeasonMatches} jornadas</span>
        </div>
      </div>

      {/* ─── Parte 1: Equipos al Límite (Dos Columnas Contrastadas o Tabs en Móvil) ─── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>⚖️</span>
            <span>Equipos al Límite: Riesgo de Caída vs Rebote Positivo</span>
          </h3>

          {/* Toggle de Pestañas en Móvil (< lg) */}
          <div className="flex lg:hidden items-center p-1 rounded-xl bg-white/5 border border-white/10 self-start sm:self-auto font-mono text-xs w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setTeamTab("all")}
              className={`flex-1 sm:flex-none px-3 py-2 min-h-[40px] rounded-lg transition-all cursor-pointer font-bold text-center touch-manipulation active:scale-95 flex items-center justify-center ${
                teamTab === "all"
                  ? isUcl
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm"
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Ambos
            </button>
            <button
              type="button"
              onClick={() => setTeamTab("risk")}
              className={`flex-1 sm:flex-none px-3 py-2 min-h-[40px] rounded-lg transition-all cursor-pointer font-bold text-center touch-manipulation active:scale-95 flex items-center justify-center ${
                teamTab === "risk"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              En Riesgo
            </button>
            <button
              type="button"
              onClick={() => setTeamTab("giants")}
              className={`flex-1 sm:flex-none px-3 py-2 min-h-[40px] rounded-lg transition-all cursor-pointer font-bold text-center touch-manipulation active:scale-95 flex items-center justify-center ${
                teamTab === "giants"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Gigantes
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna A: Sobre-rendidores en Riesgo de Caída */}
          <div
            className={`p-5 rounded-2xl bg-rose-500/[0.03] border border-rose-500/20 flex-col gap-4 relative overflow-hidden ${
              teamTab === "all" || teamTab === "risk" ? "flex" : "hidden lg:flex"
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-rose-500/20">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-pulse shadow-[0_0_8px_#f43f5e]" />
                <span className="font-bold text-sm text-rose-300 font-mono uppercase tracking-wide">
                  En Riesgo de Caída (Sobre-rendimiento)
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                REGRESIÓN NEGATIVA
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Marcan muy por encima de lo que generan sus ocasiones. Si su puntería o la efectividad del portero rival vuelve a la media histórica, perderán puntos.
            </p>

            <div className="space-y-3">
              {overperformers.map((t, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 hover:border-rose-500/30 transition-all flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 p-1 shrink-0 flex items-center justify-center">
                      {t.crest ? (
                        <img src={t.crest} alt={t.team} className="w-full h-full object-contain" />
                      ) : (
                        <span className="font-bold text-xs">{t.team.slice(0, 3)}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{t.team}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {t.goalsFor} Goles reales vs {t.xgFor.toFixed(1)} xG
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-black text-rose-400 text-sm">
                      +{t.diffGoals.toFixed(2)} Goles
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Riesgo: <strong className="text-rose-300">ALTO</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Columna B: Gigantes Dormidos (Rebote Positivo) */}
          <div
            className={`p-5 rounded-2xl bg-emerald-500/[0.03] border border-emerald-500/20 flex-col gap-4 relative overflow-hidden ${
              teamTab === "all" || teamTab === "giants" ? "flex" : "hidden lg:flex"
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
                <span className="font-bold text-sm text-emerald-300 font-mono uppercase tracking-wide">
                  Gigantes Dormidos (Sub-rendimiento)
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                REBOTE AL ALZA
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Generan ocasiones de altísimo valor pero la mala fortuna o paradas rivales los castigan. El volumen de xG garantiza que escalarán puestos en la tabla.
            </p>

            <div className="space-y-3">
              {sleepingGiants.map((t, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 hover:border-emerald-500/30 transition-all flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 p-1 shrink-0 flex items-center justify-center">
                      {t.crest ? (
                        <img src={t.crest} alt={t.team} className="w-full h-full object-contain" />
                      ) : (
                        <span className="font-bold text-xs">{t.team.slice(0, 3)}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm">{t.team}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {t.goalsFor} Goles vs {t.xgFor.toFixed(1)} xG generados
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono font-black text-emerald-400 text-sm">
                      {t.diffGoals <= 0 ? `${t.diffGoals.toFixed(2)}` : `-${t.diffGoals.toFixed(2)}`} xG deficit
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Subida: <strong className="text-emerald-300">INMINENTE</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Parte 2: Perfiles de Finalización de Jugadores ─── */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>🎯</span>
              <span>Arquetipos de Delanteros: Cazagoles de Área vs Francotiradores</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Diferencia la calidad de selección de tiro frente a la letalidad de pegada clínica.
            </p>
          </div>

          {/* Toggle de Pestaña de Jugadores */}
          <div className="flex flex-wrap sm:flex-nowrap items-center p-1 rounded-xl bg-white/5 border border-white/10 self-start sm:self-auto font-mono text-xs w-full sm:w-auto gap-1">
            <button
              type="button"
              onClick={() => setPlayerTab("cazagoles")}
              className={`flex-1 sm:flex-none px-3.5 py-2 min-h-[40px] rounded-lg transition-all cursor-pointer font-bold text-center touch-manipulation active:scale-95 flex items-center justify-center ${
                playerTab === "cazagoles"
                  ? isUcl
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm"
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Cazagoles de Área (Calidad xG/Tiro)
            </button>
            <button
              type="button"
              onClick={() => setPlayerTab("francotiradores")}
              className={`flex-1 sm:flex-none px-3.5 py-2 min-h-[40px] rounded-lg transition-all cursor-pointer font-bold text-center touch-manipulation active:scale-95 flex items-center justify-center ${
                playerTab === "francotiradores"
                  ? isUcl
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm"
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Francotiradores (Pegada G − xG)
            </button>
          </div>
        </div>

        {/* Tabla / Lista de Jugadores */}
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
          <div className="space-y-2.5">
            {(playerTab === "cazagoles" ? cazagolesList : francotiradoresList).map((player, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-white/5 hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                {/* Info Jugador */}
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-500 w-4 text-center">
                    {idx + 1}
                  </span>
                  <div className="relative w-10 h-10 rounded-full bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center shrink-0 shadow-md">
                    {player.photo ? (
                      <img src={player.photo} alt={player.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-slate-400">
                        {player.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    {player.crest && (
                      <img
                        src={player.crest}
                        alt={player.team}
                        className="absolute bottom-0 right-0 w-4 h-4 object-contain bg-slate-950 rounded-full p-0.5 border border-white/20"
                      />
                    )}
                  </div>

                  <div>
                    <div className="font-bold text-white text-sm">{player.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {player.team} · {player.position}
                    </div>
                  </div>
                </div>

                {/* Métricas clave */}
                <div className="flex items-center gap-4 sm:gap-8 justify-between sm:justify-end text-right font-mono">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Goles / Tiros</div>
                    <div className="font-bold text-white text-sm">
                      {player.goals} <span className="text-slate-500 text-xs">/ {player.shots} remates</span>
                    </div>
                  </div>

                  {playerTab === "cazagoles" ? (
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Calidad de Tiro</div>
                      <div className="font-black text-amber-300 text-sm">
                        {player.xgPerShot.toFixed(2)} xG/Sh
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Sobre-rendimiento</div>
                      <div className="font-black text-emerald-400 text-sm">
                        +{player.diff.toFixed(2)} G−xG
                      </div>
                    </div>
                  )}

                  <div className="hidden md:block">
                    <div className="text-[10px] text-slate-500 uppercase">Proyección Total</div>
                    <div className="font-bold text-cyan-300 text-sm">
                      ~{player.projGoals} goles
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

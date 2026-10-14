import { useMemo } from "react";

export function useDashboardKpis(teamsData: any[], playersData: any[], minMinutesPlayer: number) {
  return useMemo(() => {
    // Mejor equipo por xG/partido
    const bestXgTeam = teamsData.reduce((best, team) =>
      (team.xg_per_match || 0) > (best.xg_per_match || 0) ? team : best
      , teamsData[0]);

    // Mayor sobrerrendimiento (mayor diff positivo)
    const bestOverperformer = teamsData.reduce((best, team) =>
      (team.diff_goals_xg || 0) > (best.diff_goals_xg || 0) ? team : best
      , teamsData[0]);

    const filteredPlayers = playersData.filter(p => p.minutes >= minMinutesPlayer);
    const validPlayers = filteredPlayers.length > 0 ? filteredPlayers : playersData;

    // Peor infrarrendimiento (menor diff G-xG de un JUGADOR)
    const worstUnderperformingPlayer = [...validPlayers].sort((a, b) => a.diff_goals_xg - b.diff_goals_xg)[0];

    // Pichichi stats
    const pichichi = [...validPlayers].sort((a, b) => b.goals - a.goals)[0];
    const pichichiConversion = pichichi ?
      ((pichichi.goals / Math.max(pichichi.shots || 1, 1)) * 100).toFixed(1) : "0";
    const pichichiXgPerShot = pichichi ?
      (pichichi.xg / Math.max(pichichi.shots || 1, 1)).toFixed(2) : "0";

    // Media de la liga (equipos)
    const totalTeamXg = teamsData.reduce((sum, t) => sum + t.xg_for, 0);
    const totalTeamMatches = teamsData.reduce((sum, t) => sum + t.matches_played, 0);
    const leagueAvgXgPerMatch = totalTeamMatches > 0 ? (totalTeamXg / totalTeamMatches).toFixed(2) : "0.00";

    // Media de la liga (jugadores)
    const totalPlayerGoals = playersData.reduce((sum, p) => sum + p.goals, 0);
    const totalPlayerShots = playersData.reduce((sum, p) => sum + p.shots, 0);
    const totalPlayerXg = playersData.reduce((sum, p) => sum + p.xg, 0);
    const leagueAvgConv = totalPlayerShots > 0 ? ((totalPlayerGoals / totalPlayerShots) * 100).toFixed(1) : "0.0";
    const leagueAvgXgPerShot = totalPlayerShots > 0 ? (totalPlayerXg / totalPlayerShots).toFixed(2) : "0.00";

    // Media de goles de la liga
    const totalGoals = teamsData.reduce((sum, t) => sum + t.goals_for, 0);
    const totalMatches = teamsData.reduce((sum, t) => sum + t.matches_played, 0) / 2;
    const avgGoalsPerMatch = (totalGoals / Math.max(totalMatches, 1)).toFixed(2);

    return {
      bestXgTeam,
      bestOverperformer,
      worstUnderperformingPlayer,
      pichichi,
      pichichiConversion,
      pichichiXgPerShot,
      avgGoalsPerMatch,
      season: "2026-27",
      leagueAvgXgPerMatch,
      leagueAvgConv,
      leagueAvgXgPerShot
    };
  }, [teamsData, playersData, minMinutesPlayer]);
}

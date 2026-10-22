import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export interface LiveEvent {
  minute: string;
  type: "goal" | "card" | "chance";
  text: string;
  team: "home" | "away";
}

export interface LiveMatchData {
  id: string;
  competition: "laliga" | "ucl";
  status: "LIVE" | "HT" | "FT" | "NS";
  minute: string;
  date: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  home_xg: number;
  away_xg: number;
  home_shots: number;
  away_shots: number;
  home_shots_on_target: number;
  away_shots_on_target: number;
  home_possession: number;
  away_possession: number;
  home_corners: number;
  away_corners: number;
  is_real_live: boolean;
  events?: LiveEvent[];
}

export interface LiveResponse {
  success: boolean;
  last_updated: string;
  has_live: boolean;
  matches: LiveMatchData[];
}

function cleanTeamName(name: string): string {
  if (!name) return "";
  const n = name.trim();
  const lower = n.toLowerCase();
  if (lower === "internazionale") return "Inter";
  if (lower === "viking fk") return "Viking";
  if (lower === "lask linz") return "LASK";
  if (lower === "feyenoord rotterdam") return "Feyenoord";
  if (lower === "borussia dortmund") return "Borussia Dortmund";
  return n;
}

async function fetchEspnScores(comp: "ucl" | "laliga"): Promise<LiveMatchData[]> {
  const url =
    comp === "ucl"
      ? "https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard"
      : "https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/scoreboard";

  const res = await fetch(url, {
    // Revalidación corta para tiempo real sin saturar
    next: { revalidate: 15 },
    signal: AbortSignal.timeout(4000),
  });

  if (!res.ok) throw new Error(`ESPN responded with HTTP ${res.status}`);
  const data = await res.json();
  const events = data.events || [];
  const results: LiveMatchData[] = [];

  for (const event of events) {
    const competition = event.competitions?.[0];
    if (!competition) continue;

    const competitors = competition.competitors || [];
    const homeComp = competitors.find((c: any) => c.homeAway === "home");
    const awayComp = competitors.find((c: any) => c.homeAway === "away");
    if (!homeComp || !awayComp) continue;

    const state = event.status?.type?.state; // "pre" | "in" | "post"
    const isLive = state === "in";
    const isHt = event.status?.type?.name === "STATUS_HALFTIME";
    const isFt = state === "post";

    let status: "LIVE" | "HT" | "FT" | "NS" = "NS";
    if (isHt) status = "HT";
    else if (isLive) status = "LIVE";
    else if (isFt) status = "FT";

    let minute = "Programado";
    if (isHt) {
      minute = "Descanso";
    } else if (isLive) {
      const clock = event.status?.displayClock;
      minute = clock ? `${clock}'` : "LIVE";
    } else if (isFt) {
      minute = "FT";
    } else if (event.date) {
      const timeMatch = String(event.date).match(/(\d{2}:\d{2})/);
      if (timeMatch) minute = timeMatch[1];
    }

    const homeScore = parseInt(homeComp.score || "0", 10);
    const awayScore = parseInt(awayComp.score || "0", 10);

    const getStat = (compObj: any, statName: string) => {
      const s = compObj.statistics?.find((st: any) => st.name === statName);
      return s ? parseFloat(s.displayValue || "0") : 0;
    };

    const homeShots = getStat(homeComp, "totalShots");
    const awayShots = getStat(awayComp, "totalShots");
    const homeSog = getStat(homeComp, "shotsOnTarget");
    const awaySog = getStat(awayComp, "shotsOnTarget");
    let homePoss = getStat(homeComp, "possessionPct");
    let awayPoss = getStat(awayComp, "possessionPct");
    const homeCorners = getStat(homeComp, "wonCorners");
    const awayCorners = getStat(awayComp, "wonCorners");

    if (homePoss === 0 && awayPoss === 0) {
      homePoss = 50.0;
      awayPoss = 50.0;
    }

    // Modelo dinámico de xG en tiempo real basado en tiros a puerta, tiros totales y goles
    let homeXg = 0.0;
    let awayXg = 0.0;

    if (isLive || isFt) {
      const calcHome = homeScore * 0.40 + homeSog * 0.25 + Math.max(0, homeShots - homeSog) * 0.05 + homeCorners * 0.03;
      const calcAway = awayScore * 0.40 + awaySog * 0.25 + Math.max(0, awayShots - awaySog) * 0.05 + awayCorners * 0.03;
      homeXg = parseFloat(calcHome.toFixed(2));
      awayXg = parseFloat(calcAway.toFixed(2));
    }

    // Extraer eventos (goles, tarjetas)
    const matchEvents: LiveEvent[] = [];
    const details = competition.details || [];
    for (const d of details) {
      const clockVal = d.clock?.displayValue || "";
      const teamId = String(d.team?.id || "");
      const isHomeTeam = teamId === String(homeComp.id || homeComp.team?.id);
      const teamSide: "home" | "away" = isHomeTeam ? "home" : "away";
      const athleteName = d.athletesInvolved?.[0]?.displayName || d.type?.text || "Evento";

      if (d.type?.text === "Goal" || d.scoringPlay) {
        matchEvents.push({
          minute: clockVal,
          type: "goal",
          text: `⚽ Gol de ${athleteName}`,
          team: teamSide,
        });
      } else if (d.yellowCard || d.redCard || d.type?.text?.toLowerCase().includes("card")) {
        matchEvents.push({
          minute: clockVal,
          type: "card",
          text: d.redCard ? `🟥 Tarjeta roja a ${athleteName}` : `🟨 Tarjeta amarilla a ${athleteName}`,
          team: teamSide,
        });
      }
    }

    results.push({
      id: `espn_${event.id}`,
      competition: comp,
      status,
      minute,
      date: event.date || new Date().toISOString(),
      home_team: cleanTeamName(homeComp.team?.name || "Local"),
      away_team: cleanTeamName(awayComp.team?.name || "Visitante"),
      home_score: homeScore,
      away_score: awayScore,
      home_xg: homeXg,
      away_xg: awayXg,
      home_shots: homeShots,
      away_shots: awayShots,
      home_shots_on_target: homeSog,
      away_shots_on_target: awaySog,
      home_possession: homePoss,
      away_possession: awayPoss,
      home_corners: homeCorners,
      away_corners: awayCorners,
      is_real_live: isLive || isHt,
      events: matchEvents,
    });
  }

  return results;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const comp = searchParams.get("comp")?.toLowerCase();

  try {
    let allMatches: LiveMatchData[] = [];

    // 1. Intentar consultar ESPN en directo (UCL y LaLiga)
    try {
      const promises: Promise<LiveMatchData[]>[] = [];
      if (!comp || comp === "ucl") promises.push(fetchEspnScores("ucl"));
      if (!comp || comp === "laliga") promises.push(fetchEspnScores("laliga"));

      const settled = await Promise.allSettled(promises);
      for (const res of settled) {
        if (res.status === "fulfilled") {
          allMatches.push(...res.value);
        }
      }
    } catch {
      // Ignorar error de red y recurrir al archivo local
    }

    // 2. Si ESPN no devolvió partidos o falló, recurrir al archivo local de respaldo
    if (allMatches.length === 0) {
      const filePath = path.join(process.cwd(), "public", "data", "matches", "live_scores.json");
      let fileContent = "";

      if (fs.existsSync(filePath)) {
        fileContent = fs.readFileSync(filePath, "utf-8");
      } else {
        const srcFilePath = path.join(process.cwd(), "src", "data", "live_scores.json");
        if (fs.existsSync(srcFilePath)) {
          fileContent = fs.readFileSync(srcFilePath, "utf-8");
        }
      }

      if (fileContent) {
        const parsed = JSON.parse(fileContent);
        allMatches = parsed.matches || [];
      }
    }

    // Filtrar por competición si se especificó
    if (comp === "laliga" || comp === "ucl") {
      allMatches = allMatches.filter((m) => m.competition === comp);
    }

    const hasLive = allMatches.some((m) => m.status === "LIVE" || m.status === "HT");

    return NextResponse.json(
      {
        success: true,
        last_updated: new Date().toISOString(),
        has_live: hasLive,
        matches: allMatches,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=59",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Error al obtener marcadores en vivo",
        last_updated: new Date().toISOString(),
        has_live: false,
        matches: [],
      },
      { status: 500 }
    );
  }
}

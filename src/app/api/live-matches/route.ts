import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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
  events?: Array<{
    minute: number;
    type: "goal" | "card" | "chance";
    text: string;
    team: "home" | "away";
  }>;
}

export interface LiveResponse {
  success: boolean;
  last_updated: string;
  has_live: boolean;
  matches: LiveMatchData[];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const comp = searchParams.get("comp")?.toLowerCase();

  try {
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

    if (!fileContent) {
      return NextResponse.json(
        { success: false, last_updated: new Date().toISOString(), has_live: false, matches: [] },
        { status: 200 }
      );
    }

    const parsed = JSON.parse(fileContent);
    let matches: LiveMatchData[] = parsed.matches || [];

    if (comp === "laliga" || comp === "ucl") {
      matches = matches.filter((m) => m.competition === comp);
    }

    const hasLive = matches.some((m) => m.status === "LIVE" || m.status === "HT");

    return NextResponse.json(
      {
        success: true,
        last_updated: parsed.last_updated || new Date().toISOString(),
        has_live: hasLive,
        matches,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Error al leer datos en vivo",
        last_updated: new Date().toISOString(),
        has_live: false,
        matches: [],
      },
      { status: 500 }
    );
  }
}

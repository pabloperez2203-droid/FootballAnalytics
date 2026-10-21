export interface FeaturedMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  competition: "laliga" | "ucl";
  tag: string;
  subtitle?: string;
  stadium?: string;
  highlightReason?: string;
  matchday: number;
  roundLabel: string;
  dateStr: string;
  confirmed?: boolean;
  dateLabel?: string;
  relativeTime?: string;
  isUpcoming: boolean;
}

/**
 * ─── DUELOS DESTACADOS OFICIALES EN TIEMPO REAL ──────────────────────────
 * Generados automáticamente desde la API oficial de ESPN.
 * Fechas y horarios exactos en hora peninsular española (Europe/Madrid).
 * Última sincronización: 2026-10-21 11:19:18 CEST
 */
export const FEATURED_MATCHES: FeaturedMatch[] = [
  {
    "id": "laliga-j10-clasico",
    "homeTeam": "Barcelona",
    "awayTeam": "Real Madrid",
    "competition": "laliga",
    "tag": "El Clásico",
    "subtitle": "Duelo directo por el Liderato Absoluto",
    "stadium": "Spotify Camp Nou",
    "highlightReason": "Líder invicto en goles a favor frente al ataque letal blanco",
    "matchday": 10,
    "roundLabel": "Jornada 10 Oficial · LaLiga",
    "dateStr": "2026-10-25T21:00:00+01:00",
    "confirmed": true,
    "isUpcoming": true
  },
  {
    "id": "laliga-j10-derbi-valencia",
    "homeTeam": "Valencia",
    "awayTeam": "Villarreal",
    "competition": "laliga",
    "tag": "Derbi Comunitat",
    "subtitle": "Máxima Rivalidad en Mestalla",
    "stadium": "Mestalla Stadium",
    "highlightReason": "Duelo de intensidad entre dos de los planteles más dinámicos",
    "matchday": 10,
    "roundLabel": "Jornada 10 Oficial · LaLiga",
    "dateStr": "2026-10-24T18:30:00+02:00",
    "confirmed": true,
    "isUpcoming": true
  },
  {
    "id": "laliga-j10-atleti-depor",
    "homeTeam": "Atletico Madrid",
    "awayTeam": "Deportivo La Coruna",
    "competition": "laliga",
    "tag": "Duelo Histórico",
    "subtitle": "Muro del Cholo en el Metropolitano",
    "stadium": "Riyadh Air Metropolitano",
    "highlightReason": "El bloque bajo más hermético puesto a prueba en casa",
    "matchday": 10,
    "roundLabel": "Jornada 10 Oficial · LaLiga",
    "dateStr": "2026-10-24T21:00:00+02:00",
    "confirmed": true,
    "isUpcoming": true
  },
  {
    "id": "laliga-j10-celta-betis",
    "homeTeam": "Celta Vigo",
    "awayTeam": "Real Betis",
    "competition": "laliga",
    "tag": "Lucha por Europa",
    "subtitle": "Batalla Directa en Balaídos",
    "stadium": "Balaidos",
    "highlightReason": "Partidos con alta generación de volumen xG en campo contrario",
    "matchday": 10,
    "roundLabel": "Jornada 10 Oficial · LaLiga",
    "dateStr": "2026-10-25T16:15:00+01:00",
    "confirmed": true,
    "isUpcoming": true
  },
  {
    "id": "ucl-j4-atleti-bayern",
    "homeTeam": "Atletico Madrid",
    "awayTeam": "Bayern Munich",
    "competition": "ucl",
    "tag": "Choque de Gigantes",
    "subtitle": "Duelo Estelar de Champions",
    "stadium": "Riyadh Air Metropolitano",
    "highlightReason": "Transición veloz de los bávaros ante la estructura de Simeone",
    "matchday": 4,
    "roundLabel": "Jornada 4 Oficial · UCL",
    "dateStr": "2026-11-03T21:00:00+01:00",
    "confirmed": true,
    "isUpcoming": true
  },
  {
    "id": "ucl-j4-barca-astonvilla",
    "homeTeam": "Barcelona",
    "awayTeam": "Aston Villa",
    "competition": "ucl",
    "tag": "Batalla Táctica",
    "subtitle": "Posesión vs Bloque Medio Reactivo",
    "stadium": "Spotify Camp Nou",
    "highlightReason": "La escuadra de Unai Emery visita a uno de los líderes continentales",
    "matchday": 4,
    "roundLabel": "Jornada 4 Oficial · UCL",
    "dateStr": "2026-11-03T21:00:00+01:00",
    "confirmed": true,
    "isUpcoming": true
  },
  {
    "id": "ucl-j4-villarreal-psg",
    "homeTeam": "Villarreal",
    "awayTeam": "Paris Saint-Germain",
    "competition": "ucl",
    "tag": "Desafío Europeo",
    "subtitle": "La Cerámica ante el Poderío Galo",
    "stadium": "Estadio de la Cerámica",
    "highlightReason": "El ataque más voraz de la fase de liga visita al submarino amarillo",
    "matchday": 4,
    "roundLabel": "Jornada 4 Oficial · UCL",
    "dateStr": "2026-11-03T21:00:00+01:00",
    "confirmed": true,
    "isUpcoming": true
  },
  {
    "id": "ucl-j4-dortmund-betis",
    "homeTeam": "Borussia Dortmund",
    "awayTeam": "Real Betis",
    "competition": "ucl",
    "tag": "El Muro Amarillo",
    "subtitle": "Presión Total en Westfalenstadion",
    "stadium": "Signal Iduna Park",
    "highlightReason": "El Betis viaja a Dortmund a medirse contra el subcampeón de Europa",
    "matchday": 4,
    "roundLabel": "Jornada 4 Oficial · UCL",
    "dateStr": "2026-11-04T21:00:00+01:00",
    "confirmed": true,
    "isUpcoming": true
  }
];

export function getFeaturedMatches(competition?: "laliga" | "ucl" | "all"): FeaturedMatch[] {
  if (!competition || competition === "all") {
    return FEATURED_MATCHES.slice(0, 4);
  }
  return FEATURED_MATCHES.filter((m) => m.competition === competition);
}

export function getSuggestedMatchChips(competition?: "laliga" | "ucl" | string): FeaturedMatch[] {
  const activeComp = competition === "ucl" ? "ucl" : "laliga";
  const primary = FEATURED_MATCHES.filter((m) => m.competition === activeComp);
  const secondary = FEATURED_MATCHES.filter((m) => m.competition !== activeComp);
  return [...primary, ...secondary].slice(0, 4);
}

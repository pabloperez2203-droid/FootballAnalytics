import crestsData from '../../public/crests/crests.json';

const UCL_CRESTS: Record<string, string> = {
  "paris saint-germain": "/crests/paris-saint-germain.png",
  "aston villa": "/crests/aston-villa.png",
  "liverpool": "/crests/liverpool.png",
  "real madrid": "/crests/real-madrid.svg",
  "real betis": "/crests/real-betis.svg",
  "stuttgart": "/crests/stuttgart.png",
  "arsenal": "/crests/arsenal.png",
  "barcelona": "/crests/barcelona.svg",
  "como": "/crests/como.png",
  "manchester city": "/crests/manchester-city.png",
  "club brugge": "/crests/club-brugge.png",
  "sporting cp": "/crests/sporting-cp.png",
  "borussia dortmund": "/crests/borussia-dortmund.png",
  "bayern munich": "/crests/bayern-munich.png",
  "roma": "/crests/roma.png",
  "atletico madrid": "/crests/atletico-madrid.svg",
  "shakhtar donetsk": "/crests/shakhtar-donetsk.png",
  "psv eindhoven": "/crests/psv-eindhoven.png",
  "villarreal": "/crests/villarreal.svg",
  "inter": "/crests/inter.png",
  "manchester united": "/crests/manchester-united.png",
  "napoli": "/crests/napoli.png",
  "galatasaray": "/crests/galatasaray.png",
  "lask": "/crests/lask.png",
  "sabah fk": "/crests/sabah-fk.png",
  "feyenoord": "/crests/feyenoord.png",
  "lens": "/crests/lens.png",
  "bodo glimt": "/crests/bodo-glimt.png",
  "aek athens": "/crests/aek-athens.png",
  "rb leipzig": "/crests/rb-leipzig.png",
  "fenerbahce": "/crests/fenerbahce.png",
  "slavia prague": "/crests/slavia-prague.png",
  "viking": "/crests/viking.png",
  "fc porto": "/crests/fc-porto.png",
  "lille": "/crests/lille.png",
  "slovan bratislava": "/crests/slovan-bratislava.png",
};

export function getTeamCrest(teamName: string): string {
  if (!teamName) return '';
  const team = crestsData.find((c: any) => c.equipo.toLowerCase() === teamName.toLowerCase());
  if (team) return team.archivo;
  const normalized = teamName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  return UCL_CRESTS[normalized] || '';
}

const TEAM_COLORS: Record<string, string> = {
  // LaLiga
  "barcelona": "#a50044",
  "fc barcelona": "#a50044",
  "real madrid": "#3b82f6",
  "atletico madrid": "#ef4444",
  "atletico de madrid": "#ef4444",
  "athletic club": "#dc2626",
  "athletic bilbao": "#dc2626",
  "athletic": "#dc2626",
  "real sociedad": "#2563eb",
  "villarreal": "#eab308",
  "real betis": "#10b981",
  "betis": "#10b981",
  "sevilla": "#e11d48",
  "valencia": "#f97316",
  "celta vigo": "#38bdf8",
  "celta de vigo": "#38bdf8",
  "celta": "#38bdf8",
  "rayo vallecano": "#f43f5e",
  "osasuna": "#b91c1c",
  "getafe": "#1d4ed8",
  "alaves": "#3b82f6",
  "deportivo alaves": "#3b82f6",
  "espanyol": "#0284c7",
  "rcd espanyol": "#0284c7",
  "girona": "#e11d48",
  "mallorca": "#dc2626",
  "rcd mallorca": "#dc2626",
  "las palmas": "#eab308",
  "ud las palmas": "#eab308",
  "leganes": "#2563eb",
  "cd leganes": "#2563eb",
  "valladolid": "#7c3aed",
  "real valladolid": "#7c3aed",
  "racing santander": "#059669",
  "racing de santander": "#059669",
  "levante": "#1e40af",
  "elche": "#15803d",
  "deportivo la coruna": "#2563eb",
  "malaga": "#38bdf8",

  // Champions League
  "manchester city": "#38bdf8",
  "liverpool": "#dc2626",
  "arsenal": "#ef4444",
  "bayern munich": "#dc2626",
  "borussia dortmund": "#eab308",
  "bayer leverkusen": "#ef4444",
  "paris saint-germain": "#1d4ed8",
  "monaco": "#e11d48",
  "lille": "#e11d48",
  "inter": "#0284c7",
  "juventus": "#94a3b8",
  "ac milan": "#dc2626",
  "atalanta": "#1d4ed8",
  "sporting cp": "#10b981",
  "benfica": "#ef4444",
  "aston villa": "#831843",
  "psv eindhoven": "#ef4444",
  "feyenoord": "#ef4444",
  "celtic": "#10b981",
  "club brugge": "#0284c7",
  "dinamo zagreb": "#1d4ed8",
  "stuttgart": "#dc2626",
  "rb leipzig": "#dc2626",
  "shakhtar donetsk": "#f97316",
  "bologna": "#1e3a8a",
  "red star belgrade": "#dc2626",
  "salzburg": "#dc2626",
  "sparta prague": "#831843",
  "young boys": "#eab308",
  "brest": "#dc2626",
  "slovan bratislava": "#38bdf8",
  "sturm graz": "#64748b",

  // Champions League additions
  "vfb stuttgart": "#e32219",
  "bayern munchen": "#dc052d",
  "como": "#003882",
  "manchester united": "#da291c",
  "lens": "#ec1c24",
  "aek athens": "#ffcc00",
  "sabah fk": "#002d72",
  "bodo glimt": "#ffde00",
  "roma": "#8e1f2f",
  "viking": "#001c44",
  "fenerbahce": "#002d72",
  "fc porto": "#003882",
  "slavia prague": "#d71920",
  "napoli": "#12a0d7",
  "lask": "#222222",
  "galatasaray": "#a90432",
  "milan": "#dc2626",
};

export function getTeamColor(teamName: string): string {
  if (!teamName) return "#3b82f6";
  const normalized = teamName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  return TEAM_COLORS[normalized] || "#3b82f6";
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  if (clean.length === 6) {
    return {
      r: parseInt(clean.substring(0, 2), 16),
      g: parseInt(clean.substring(2, 4), 16),
      b: parseInt(clean.substring(4, 6), 16),
    };
  }
  return null;
}

function getHue(r: number, g: number, b: number): number {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  let h = 0;
  if (max === r) {
    h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  } else if (max === g) {
    h = ((b - r) / d + 2) * 60;
  } else {
    h = ((r - g) / d + 4) * 60;
  }
  return h;
}

export function getColorCategory(hex: string): 'red' | 'blue' | 'yellow' | 'green' | 'other' {
  const rgb = hexToRgb(hex);
  if (!rgb) return 'other';
  const hue = getHue(rgb.r, rgb.g, rgb.b);
  if (hue >= 320 || hue <= 35) return 'red';      // Rojos, granates, carmesí
  if (hue >= 170 && hue <= 265) return 'blue';   // Azules, celestes, marinos
  if (hue > 35 && hue < 75) return 'yellow';     // Amarillos / dorados
  if (hue >= 75 && hue < 170) return 'green';    // Verdes
  return 'other';
}

export function areColorsTooSimilar(hex1: string, hex2: string): boolean {
  if (!hex1 || !hex2) return false;
  if (hex1.toLowerCase() === hex2.toLowerCase()) return true;

  const cat1 = getColorCategory(hex1);
  const cat2 = getColorCategory(hex2);
  if (cat1 === cat2 && cat1 !== 'other') return true;

  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return false;
  const dist = Math.sqrt(
    Math.pow(rgb1.r - rgb2.r, 2) +
    Math.pow(rgb1.g - rgb2.g, 2) +
    Math.pow(rgb1.b - rgb2.b, 2)
  );
  return dist < 135;
}

export function resolveContrastingColors(homeColor: string, awayColor: string): { homeColor: string; awayColor: string } {
  if (areColorsTooSimilar(homeColor, awayColor)) {
    const catHome = getColorCategory(homeColor);
    let contrastingAway = '#f59e0b';
    if (catHome === 'red') {
      contrastingAway = '#06b6d4'; // Cian eléctrico
    } else if (catHome === 'blue') {
      contrastingAway = '#f59e0b'; // Ámbar dorado brillante
    } else if (catHome === 'green') {
      contrastingAway = '#f43f5e'; // Rosa coral
    } else if (catHome === 'yellow') {
      contrastingAway = '#3b82f6'; // Azul intenso
    }
    return { homeColor, awayColor: contrastingAway };
  }
  return { homeColor, awayColor };
}

export function getMatchTeamColors(homeTeam: string, awayTeam: string): { homeColor: string; awayColor: string } {
  const rawHome = getTeamColor(homeTeam);
  const rawAway = getTeamColor(awayTeam);
  return resolveContrastingColors(rawHome, rawAway);
}

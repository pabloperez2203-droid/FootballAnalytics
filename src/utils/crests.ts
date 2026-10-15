import crestsData from '../../public/crests/crests.json';

export function getTeamCrest(teamName: string): string {
  const team = crestsData.find((c: any) => c.equipo === teamName);
  return team ? team.archivo : '';
}

const TEAM_COLORS: Record<string, string> = {
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
  "malaga": "#38bdf8"
};

export function getTeamColor(teamName: string): string {
  if (!teamName) return "#3b82f6";
  const normalized = teamName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  return TEAM_COLORS[normalized] || "#3b82f6";
}

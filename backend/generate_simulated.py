"""
═══════════════════════════════════════════════════════════════════════════
  generate_simulated.py — Genera datos simulados realistas de La Liga
  
  Reglas:
  - Jornada única de referencia (7).
  - xG por partido de equipo: 0.8 - 2.6
  - Conversión de jugadores: 8% - 22%
  - xG/tiro: 0.08 - 0.15
  - Minutos coherentes con partidos (máx 90 por partido).
═══════════════════════════════════════════════════════════════════════════
"""
import os
import json
import random
from datetime import datetime, timezone

SEASON_LABEL = "2026-27"
MATCHDAY = 7
SIM_DIR = os.path.join(os.path.dirname(__file__), "data", "simulado")
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "src", "data")
os.makedirs(SIM_DIR, exist_ok=True)
os.makedirs(FRONTEND_DIR, exist_ok=True)

NOW_ISO = datetime.now(timezone.utc).isoformat()
random.seed(42)

TEAMS = [
    ("Barcelona", "elite"), ("Real Madrid", "elite"),
    ("Atletico Madrid", "top"), ("Athletic Club", "top"), ("Villarreal", "top"),
    ("Real Betis", "mid_high"), ("Real Sociedad", "mid_high"), ("Sevilla", "mid_high"),
    ("Celta Vigo", "mid"), ("Rayo Vallecano", "mid"), ("Osasuna", "mid"), ("Girona", "mid"),
    ("Mallorca", "mid_low"), ("Valencia", "mid_low"), ("Getafe", "mid_low"), ("Espanyol", "mid_low"),
    ("Deportivo La Coruna", "low"), ("Levante", "low"), ("Racing Santander", "low"), ("Leganes", "low"),
]

TIER_XG_MATCH = {
    "elite": (2.1, 2.6),
    "top": (1.7, 2.1),
    "mid_high": (1.4, 1.7),
    "mid": (1.1, 1.4),
    "mid_low": (0.9, 1.1),
    "low": (0.8, 0.95),
}

PLAYER_TEMPLATES = {
    "elite": [("FW", 4, 10), ("FW", 3, 7), ("MF", 2, 5), ("MF", 1, 3), ("MF", 0, 2), ("DF", 0, 1), ("GK", 0, 0)],
    "top": [("FW", 3, 8), ("FW", 2, 5), ("MF", 1, 4), ("MF", 0, 2), ("DF", 0, 1), ("GK", 0, 0)],
    "mid_high": [("FW", 2, 6), ("MF", 1, 3), ("MF", 0, 2), ("DF", 0, 1)],
    "mid": [("FW", 2, 5), ("MF", 1, 3), ("DF", 0, 1)],
    "mid_low": [("FW", 1, 4), ("MF", 0, 2), ("DF", 0, 1)],
    "low": [("FW", 1, 3), ("MF", 0, 1), ("DF", 0, 1)],
}

def generate_teams():
    teams = []
    for team_name, tier in TEAMS:
        xg_per_match = random.uniform(*TIER_XG_MATCH[tier])
        xg_for = round(xg_per_match * MATCHDAY, 2)
        
        # Rendimiento real respecto a xG (entre -20% y +30% para simular racha)
        goals_for = int(round(xg_for * random.uniform(0.8, 1.3)))
        
        # xG against (inverso al tier)
        xga_per_match = random.uniform(*(TIER_XG_MATCH["low"] if tier=="elite" else TIER_XG_MATCH["elite"] if tier=="low" else (1.0, 1.8)))
        xg_against = round(xga_per_match * MATCHDAY, 2)
        goals_against = int(round(xg_against * random.uniform(0.8, 1.3)))
        
        teams.append({
            "rank": 0,
            "team": team_name,
            "matches_played": MATCHDAY,
            "goals_for": goals_for,
            "xg_for": xg_for,
            "np_xg_for": round(xg_for * 0.9, 2),
            "goals_against": goals_against,
            "xg_against": xg_against,
            "ppda_avg": round(random.uniform(7.0, 15.0), 2),
            "deep_completions": random.randint(20, 60),
            "expected_points": round(MATCHDAY * random.uniform(0.5, 2.5), 2),
            "diff_goals_xg": round(goals_for - xg_for, 2),
            "diff_goals_xg_against": round(goals_against - xg_against, 2),
            "xg_per_match": round(xg_for / MATCHDAY, 2),
            "goals_per_match": round(goals_for / MATCHDAY, 2),
            "source": "simulado",
            "fetched_at": NOW_ISO,
            "season": SEASON_LABEL,
            "is_simulated": True,
        })
    teams.sort(key=lambda t: t["diff_goals_xg"], reverse=True)
    for i, t in enumerate(teams):
        t["rank"] = i + 1
    return teams

def generate_players(teams_data):
    FIRST_NAMES = ["Carlos", "Pedro", "Luis", "Jorge", "Sergio", "Luka", "Fede", "Nico", "Dani", "Aitor", "Samu", "Borja", "Kepa"]
    LAST_NAMES = ["García", "Martínez", "López", "Fernández", "Rodríguez", "Pérez", "Sánchez", "Hernández", "Ruiz", "Díaz", "Torres"]
    
    players = []
    used_names = set()
    
    for t_data in teams_data:
        team_name = t_data["team"]
        tier = dict(TEAMS)[team_name]
        templates = PLAYER_TEMPLATES[tier]
        
        for pos, min_g, max_g in templates:
            name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
            while name in used_names:
                name = f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
            used_names.add(name)
            
            goals = random.randint(min_g, max_g)
            
            # Conversión: 8% a 22%
            conversion = random.uniform(0.08, 0.22)
            shots = int(round(goals / conversion)) if goals > 0 else random.randint(1, 10)
            
            # xG/tiro: 0.08 a 0.15
            xg_per_shot = random.uniform(0.08, 0.15)
            xg = round(shots * xg_per_shot, 2)
            
            matches = random.randint(MATCHDAY - 2, MATCHDAY) if MATCHDAY > 2 else MATCHDAY
            minutes = random.randint(matches * 45, matches * 90)
            
            players.append({
                "league": "ESP-La Liga",
                "season": SEASON_LABEL,
                "team_name": team_name,
                "player_name": name,
                "league_id": 4,
                "season_id": 2026,
                "team_id": hash(team_name) % 10000,
                "player_id": hash(name) % 100000,
                "position": pos,
                "matches": matches,
                "minutes": minutes,
                "goals": goals,
                "xg": xg,
                "np_goals": max(0, goals - random.randint(0, 1)),
                "np_xg": round(max(0, xg - random.uniform(0, 0.5)), 2),
                "assists": random.randint(0, goals),
                "xa": round(random.uniform(0, xg), 2),
                "shots": shots,
                "key_passes": random.randint(1, 15),
                "yellow_cards": random.randint(0, 3),
                "red_cards": 0,
                "xg_chain": round(xg * 1.5, 2),
                "xg_buildup": round(xg * 0.5, 2),
                "diff_goals_xg": round(goals - xg, 2),
                "source": "simulado",
                "fetched_at": NOW_ISO,
                "is_simulated": True,
            })
    return players

def main():
    teams = generate_teams()
    players = generate_players(teams)
    
    # Save simulated
    with open(os.path.join(SIM_DIR, f"equipos_{SEASON_LABEL}_simulado.json"), "w") as f:
        json.dump(teams, f, ensure_ascii=False, indent=2)
    with open(os.path.join(SIM_DIR, f"jugadores_{SEASON_LABEL}_simulado.json"), "w") as f:
        json.dump(players, f, ensure_ascii=False, indent=2)

    # Save to frontend as well!
    with open(os.path.join(FRONTEND_DIR, f"equipos_{SEASON_LABEL}_simulado.json"), "w") as f:
        json.dump(teams, f, ensure_ascii=False, indent=2)
    with open(os.path.join(FRONTEND_DIR, f"jugadores_{SEASON_LABEL}_simulado.json"), "w") as f:
        json.dump(players, f, ensure_ascii=False, indent=2)
        
    print(f"✅ Simulados {len(teams)} equipos, {len(players)} jugadores")

if __name__ == "__main__":
    main()

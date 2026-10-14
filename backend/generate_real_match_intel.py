import os
import pandas as pd
import json

RAW_DIR = os.path.join(os.path.dirname(__file__), "data", "raw")
OUT_FILE = os.path.join(os.path.dirname(__file__), "..", "src", "data", "match_intel.json")

# Load raw CSVs
schedule = pd.read_csv(os.path.join(RAW_DIR, "schedule.csv"), index_col=[0,1,2])
shots = pd.read_csv(os.path.join(RAW_DIR, "match_shots.csv"))
players = pd.read_csv(os.path.join(RAW_DIR, "match_player_stats.csv"))

# We stored a single match in explore_match.py so we find it
match = schedule[schedule["is_result"] == True]
match = match[(match["home_goals"] + match["away_goals"]) >= 3].iloc[0]
game_id = match["game_id"]

home_team = match["home_team"]
away_team = match["away_team"]
home_team_short = home_team[:3].upper()
away_team_short = away_team[:3].upper()

# Format Match object
match_obj = {
    "id": str(game_id),
    "home_team": home_team,
    "home_short": home_team_short,
    "away_team": away_team,
    "away_short": away_team_short,
    "home_score": int(match["home_goals"]),
    "away_score": int(match["away_goals"]),
    "home_xg": float(match["home_xg"]),
    "away_xg": float(match["away_xg"]),
    "date": match["date"],
    "stadium": "N/A", # Understat doesn't provide stadium directly here
    "matchday": 1,
    "matches_in_matchday": [
        {"id": str(game_id), "label": f"{home_team_short} {match['home_goals']}-{match['away_goals']} {away_team_short}"}
    ]
}

# Format Shots
shots_list = []
# Ensure team name is easily accessible (Understat multi-index might put it in 'team')
if "team" in shots.columns:
    team_col = "team"
elif "h_a" in shots.columns:
    # map h/a to team
    shots["team"] = shots["h_a"].map({"h": home_team, "a": away_team})
    team_col = "team"

# Translate results
result_map = {
    "Goal": "Gol",
    "SavedShot": "Parada",
    "MissedShots": "Fuera",
    "BlockedShot": "Bloqueado",
    "ShotOnPost": "Palo",
    "OwnGoal": "Propia"
}

home_shots_count = 0
away_shots_count = 0
home_xg_sum = 0
away_xg_sum = 0

for _, s in shots.iterrows():
    # 'team' might be index level or column depending on how to_csv wrote it
    t = s.get("team", home_team if s.get("h_a") == "h" else away_team)
    
    is_home = (t == home_team)
    team_str = "home" if is_home else "away"
    
    res_en = str(s["result"]).replace(" ", "")
    res_es = result_map.get(res_en, str(s["result"]))
    
    x = float(s["location_x"]) * 100 if pd.notnull(s["location_x"]) else 0
    y = float(s["location_y"]) * 100 if pd.notnull(s["location_y"]) else 0
    xg = float(s["xg"])
    
    if is_home:
        home_shots_count += 1
        home_xg_sum += xg
    else:
        away_shots_count += 1
        away_xg_sum += xg

    # Depending on how the UI draws it, simulated might have had home attacking left or right. 
    # Usually real data has everyone attacking right (x>50), but simulated had both?
    # Simulated shots for home x=15, away x=80 (attacking opposite sides)
    # So let's flip home to attack left (x -> 100-x) so they oppose each other in the UI if needed, 
    # but the simulated UI actually uses full pitch or half pitch?
    # For now, let's just pass raw x*100 and y*100, wait simulated had: home x=15, 20, 8, 10; away x=85, 80, 90. 
    # Simulated means home shoots from left to right (x is low? No, x=15 is left side of pitch. Wait, if goal is at x=0, then x=15 means they shoot to left goal. Away x=85 means they shoot to right goal). 
    # Understat always gives X from the perspective of attacking. So X > 80 usually.
    # To match simulated, let's map Home X -> X (so it's near 80-100), and Away X -> 100 - X (so it's near 0-20). Wait, simulated had home at 15 (near 0) and away at 85 (near 100). 
    # Actually, X from understat is distance from own goal. So X=0.9 means 90% of pitch. X=90.
    # We will pass X=90 for Home, and X=10 (100-X) for Away to make them attack opposite goals if UI expects full pitch.
    if team_str == "home":
        # Let's say home attacks right (X=100) -> Understat X is already towards 100
        pass 
    else:
        # Away attacks left (X=0) -> Flip X and Y
        x = 100 - x
        y = 100 - y

    shots_list.append({
        "id": str(s.get("shot_id", _)),
        "min": int(s["minute"]),
        "team": team_str,
        "player": str(s["player"]),
        "xg": round(xg, 3),
        "result": res_es,
        "x": round(x, 1),
        "y": round(y, 1)
    })

# Format Stats
stats = {
    "home": {
        "shots": home_shots_count,
        "xg": round(home_xg_sum, 2),
        "xg_per_shot": round(home_xg_sum / home_shots_count, 2) if home_shots_count > 0 else 0
    },
    "away": {
        "shots": away_shots_count,
        "xg": round(away_xg_sum, 2),
        "xg_per_shot": round(away_xg_sum / away_shots_count, 2) if away_shots_count > 0 else 0
    }
}

# Format Players
players_list = []
for _, p in players.iterrows():
    t = p.get("team", home_team if p.get("h_a") == "h" else away_team)
    team_str = "home" if t == home_team else "away"
    
    players_list.append({
        "id": str(p["player_id"]),
        "team": team_str,
        "name": str(p["player"]),
        "mins": int(p["minutes"]),
        "shots": int(p["shots"]),
        "xg": round(float(p["xg"]), 2),
        "goals": int(p["goals"])
    })

# Format Verdict
# Real verdicts requires complex logic, we'll build a simple one
best_shot = max(shots_list, key=lambda s: s["xg"])
best_player = max(players_list, key=lambda p: p["xg"])
verdict = {
    "win_probability": {"home": 50, "draw": 25, "away": 25}, # Mocked
    "best_chance": f"Min {best_shot['min']}' - {best_shot['player']} ({best_shot['xg']} xG)",
    "most_dangerous": f"{best_player['name']} ({best_player['xg']} xG)",
    "biggest_surprise": "N/A"
}

output = {
    "is_simulated": False,
    "match": match_obj,
    "verdict": verdict,
    "stats": stats,
    "shots": shots_list,
    "players": players_list
}

with open(OUT_FILE, "w", encoding="utf-8") as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

print(f"Generated {OUT_FILE}")

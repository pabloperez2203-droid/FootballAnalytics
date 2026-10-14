import os
import pandas as pd
import json

CACHE_DIR = os.path.join(os.path.dirname(__file__), "data", "cache")
os.environ["SOCCERDATA_DIR"] = CACHE_DIR
import soccerdata as sd

us = sd.Understat(leagues="ESP-La Liga", seasons="2026")

schedule = us.read_schedule()
RAW_DIR = os.path.join(os.path.dirname(__file__), "data", "raw")

# Select a match with goals
played = schedule[schedule["is_result"] == True]
# Find a match with multiple goals
candidates = played[(played["home_goals"] + played["away_goals"]) >= 3]
match = candidates.iloc[0]
game_id = match["game_id"]
print(f"Selected match: {match['home_team']} {match['home_goals']} - {match['away_goals']} {match['away_team']} (Game ID: {game_id})")

# Fetch shots
shots = us.read_shot_events(match_id=[game_id])
shots.to_csv(os.path.join(RAW_DIR, "match_shots.csv"))

# Fetch player stats
player_stats = us.read_player_match_stats(match_id=[game_id])
player_stats.to_csv(os.path.join(RAW_DIR, "match_player_stats.csv"))

# Print schedule row
print("\n--- SCHEDULE ---")
print(pd.DataFrame([match])[['date', 'home_team', 'away_team', 'home_goals', 'away_goals', 'home_xg', 'away_xg']])

# Print shots columns and first rows
print("\n--- SHOTS ---")
print("Columns:", shots.columns.tolist())
print(shots.head(3))

# Print player stats columns and first rows
print("\n--- PLAYER STATS ---")
print("Columns:", player_stats.columns.tolist())
print(player_stats.head(3))

# Validations
print("\n--- VALIDATIONS ---")
home_xg_sch = match["home_xg"]
away_xg_sch = match["away_xg"]
home_team_name = match["home_team"]
away_team_name = match["away_team"]

# Reset index to access 'team' column easily
shots_reset = shots.reset_index()

home_xg_shots = shots_reset[shots_reset["team"] == home_team_name]["xg"].sum()
away_xg_shots = shots_reset[shots_reset["team"] == away_team_name]["xg"].sum()

print(f"Home ({home_team_name}) xG: Schedule={home_xg_sch:.3f}, Shots={home_xg_shots:.3f}, Diff={abs(home_xg_sch - home_xg_shots):.3f}")
print(f"Away ({away_team_name}) xG: Schedule={away_xg_sch:.3f}, Shots={away_xg_shots:.3f}, Diff={abs(away_xg_sch - away_xg_shots):.3f}")

goals_shots_home = len(shots_reset[(shots_reset["team"] == home_team_name) & (shots_reset["result"] == "Goal")])
goals_shots_away = len(shots_reset[(shots_reset["team"] == away_team_name) & (shots_reset["result"] == "Goal")])
print(f"Home Goals: Schedule={match['home_goals']}, Shots={goals_shots_home}")
print(f"Away Goals: Schedule={match['away_goals']}, Shots={goals_shots_away}")

# Check Own Goals
og_shots = shots_reset[shots_reset["result"] == "OwnGoal"]
print(f"Own Goals in shots: {len(og_shots)}")

# Duplicates / NaNs
dups = shots_reset.duplicated(subset=['shot_id']).sum()
nans = shots_reset.isna().sum().sum()
print(f"Duplicates (by shot_id): {dups}")
print(f"Empty (NaNs) across all columns: {nans}")

# Coordinate directions
print("\n--- COORDINATES (X) ---")
print(shots_reset.groupby("team")["location_x"].mean())



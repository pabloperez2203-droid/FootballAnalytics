import os
import sys
import json
import argparse
import pandas as pd
import math

CACHE_DIR = os.path.join(os.path.dirname(__file__), "data", "cache")
os.environ["SOCCERDATA_DIR"] = CACHE_DIR
import soccerdata as sd

RAW_DIR = os.path.join(os.path.dirname(__file__), "data", "raw")
PUBLIC_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "data", "matches")
VALIDATION_FILE = os.path.join(os.path.dirname(__file__), "data", "validation_report.json")
TEAM_NAMES_FILE = os.path.join(os.path.dirname(__file__), "team_names.json")
PARTIDOS_CSV_FILE = os.path.join(os.path.dirname(__file__), "data", "real", "PartidosJornadas.csv")

os.makedirs(PUBLIC_DATA_DIR, exist_ok=True)
os.makedirs(os.path.dirname(VALIDATION_FILE), exist_ok=True)

def load_partidos_csv():
    if os.path.exists(PARTIDOS_CSV_FILE):
        return pd.read_csv(PARTIDOS_CSV_FILE, sep=";")
    return pd.DataFrame()

def load_team_names():
    if os.path.exists(TEAM_NAMES_FILE):
        with open(TEAM_NAMES_FILE, "r") as f:
            return json.load(f)
    return {}

def save_team_names(names):
    with open(TEAM_NAMES_FILE, "w") as f:
        json.dump(names, f, indent=2)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="Force rebuild of existing matches")
    args = parser.parse_args()

    us = sd.Understat(leagues="ESP-La Liga", seasons="2026")
    schedule = us.read_schedule()
    played = schedule[schedule["is_result"] == True].copy()
    played.sort_values(by="date", inplace=True)
    
    team_names = load_team_names()
    missing_teams = set()
    df_csv = load_partidos_csv()
    
    # Create dict of game_id -> matchday
    jornadas_map = {}
    if not df_csv.empty:
        for _, r in df_csv.iterrows():
            jf = r.get("jornada_fuente")
            if pd.notna(jf) and jf != "":
                jornadas_map[str(r["match_id"])] = int(float(jf))
            else:
                jornadas_map[str(r["match_id"])] = int(r["jornada"])
            
    # Filter schedule to matches <= jornada 7
    played_list = []
    for idx, match in played.iterrows():
        game_id = str(match["game_id"])
        if game_id in jornadas_map and jornadas_map[game_id] <= 7:
            played_list.append(match)
            
    target_matches = pd.DataFrame(played_list)
    
    validation_report = {}
    if os.path.exists(VALIDATION_FILE):
        with open(VALIDATION_FILE, "r") as f:
            validation_report = json.load(f)
            
    index_data = []

    # Keep track of matchdays for validation
    matchdays_data = {}

    # Process matches
    for idx, (index_tuple, match) in enumerate(target_matches.iterrows()):
        game_id = str(match["game_id"])
        
        matchday = jornadas_map.get(game_id, 99)
        
        home_team = match["home_team"]
        away_team = match["away_team"]
        
        # Team mappings
        if home_team not in team_names:
            missing_teams.add(home_team)
            team_names[home_team] = home_team
        if away_team not in team_names:
            missing_teams.add(away_team)
            team_names[away_team] = away_team
            
        home_team_mapped = team_names[home_team]
        away_team_mapped = team_names[away_team]
        
        out_file = os.path.join(PUBLIC_DATA_DIR, f"{game_id}.json")
        
        needs_review = False
        val_errors = []
        
        # If exists and not force, just read stats for index and skip fetching
        if os.path.exists(out_file) and not args.force:
            with open(out_file, "r") as f:
                existing_data = json.load(f)
                needs_review = existing_data.get("match", {}).get("needs_review", False)
        else:
            print(f"Processing Match {game_id}: {home_team} vs {away_team}")
            shots = us.read_shot_events(match_id=[match["game_id"]])
            players = us.read_player_match_stats(match_id=[match["game_id"]])
            
            shots_reset = shots.reset_index()
            players_reset = players.reset_index()
            
            # Validations
            home_xg_sch = float(match["home_xg"])
            away_xg_sch = float(match["away_xg"])
            home_goals_sch = int(match["home_goals"])
            away_goals_sch = int(match["away_goals"])
            
            home_xg_shots = float(shots_reset[shots_reset["team"] == home_team]["xg"].sum())
            away_xg_shots = float(shots_reset[shots_reset["team"] == away_team]["xg"].sum())
            
            home_goals_shots = len(shots_reset[(shots_reset["team"] == home_team) & (shots_reset["result"] == "Goal")])
            away_goals_shots = len(shots_reset[(shots_reset["team"] == away_team) & (shots_reset["result"] == "Goal")])
            
            home_og = len(shots_reset[(shots_reset["team"] == away_team) & (shots_reset["result"] == "OwnGoal")])
            away_og = len(shots_reset[(shots_reset["team"] == home_team) & (shots_reset["result"] == "OwnGoal")])
            
            if not math.isclose(home_xg_sch, home_xg_shots, abs_tol=0.05):
                val_errors.append(f"Home xG mismatch: {home_xg_sch} != {home_xg_shots}")
            if not math.isclose(away_xg_sch, away_xg_shots, abs_tol=0.05):
                val_errors.append(f"Away xG mismatch: {away_xg_sch} != {away_xg_shots}")
                
            if (home_goals_shots + home_og) != home_goals_sch:
                val_errors.append(f"Home goals mismatch: {home_goals_sch} != {home_goals_shots} (shots) + {home_og} (OG)")
            if (away_goals_shots + away_og) != away_goals_sch:
                val_errors.append(f"Away goals mismatch: {away_goals_sch} != {away_goals_shots} (shots) + {away_og} (OG)")
                
            dups = int(shots_reset.duplicated(subset=['shot_id']).sum())
            if dups > 0:
                val_errors.append(f"Duplicate shots found: {dups}")
                
            if val_errors:
                needs_review = True
                validation_report[game_id] = val_errors
            elif game_id in validation_report:
                del validation_report[game_id]
                
            # Build JSON
            result_map = {
                "Goal": "Gol", "SavedShot": "Parada", "MissedShots": "Fuera",
                "BlockedShot": "Bloqueado", "ShotOnPost": "Palo", "OwnGoal": "Propia"
            }
            
            shots_list = []
            for _, s in shots_reset.iterrows():
                t = s["team"]
                is_home = (t == home_team)
                team_str = "home" if is_home else "away"
                res_es = result_map.get(str(s["result"]).replace(" ", ""), str(s["result"]))
                x = float(s["location_x"]) * 100 if pd.notnull(s["location_x"]) else 0
                y = float(s["location_y"]) * 100 if pd.notnull(s["location_y"]) else 0
                if team_str == "away":
                    x = 100 - x
                    y = 100 - y
                    
                shots_list.append({
                    "id": str(s["shot_id"]), "min": int(s["minute"]), "team": team_str,
                    "player": str(s["player"]), "xg": round(float(s["xg"]), 3),
                    "result": res_es, "x": round(x, 1), "y": round(y, 1)
                })
                
            players_list = []
            for _, p in players_reset.iterrows():
                t = p["team"]
                team_str = "home" if t == home_team else "away"
                position = str(p.get("position", "Unknown"))
                is_starter = position != "Sub"
                players_list.append({
                    "id": str(p["player_id"]), "team": team_str, "name": str(p["player"]),
                    "mins": int(p["minutes"]), "shots": int(p["shots"]),
                    "xg": round(float(p["xg"]), 2), "goals": int(p["goals"]),
                    "position": position, "is_starter": is_starter
                })
                
            match_obj = {
                "id": game_id, "home_team": home_team_mapped, "home_short": home_team_mapped[:3].upper(),
                "away_team": away_team_mapped, "away_short": away_team_mapped[:3].upper(),
                "home_score": home_goals_sch, "away_score": away_goals_sch,
                "home_xg": home_xg_sch, "away_xg": away_xg_sch, "date": str(match["date"]),
                "stadium": "N/A", "matchday": matchday, "needs_review": needs_review
            }
            
            verdict = {
                "win_probability": {"home": 50, "draw": 25, "away": 25},
                "best_chance": "Estimación (solo xG)",
                "most_dangerous": "Estimación (solo xG)",
                "biggest_surprise": "Estimación (solo xG)"
            }
            
            stats = {
                "home": {"shots": len([s for s in shots_list if s["team"]=="home"]), "xg": home_xg_shots, "xg_per_shot": round(home_xg_shots/max(1, len([s for s in shots_list if s["team"]=="home"])), 2)},
                "away": {"shots": len([s for s in shots_list if s["team"]=="away"]), "xg": away_xg_shots, "xg_per_shot": round(away_xg_shots/max(1, len([s for s in shots_list if s["team"]=="away"])), 2)}
            }
            
            # Extract rosters from raw cache JSON
            rosters = {"h": {}, "a": {}}
            cache_file = os.path.join(CACHE_DIR, "data", "Understat", f"match_{game_id}.json")
            if os.path.exists(cache_file):
                with open(cache_file, "r") as cf:
                    try:
                        raw_match = json.load(cf)
                        rosters = raw_match.get("rosters", {"h": {}, "a": {}})
                    except:
                        pass
            
            output = {
                "is_simulated": False, "match": match_obj, "verdict": verdict,
                "stats": stats, "shots": shots_list, "players": players_list,
                "rosters": rosters
            }
            
            with open(out_file, "w") as f:
                json.dump(output, f, indent=2)

        # Append to index
        index_data.append({
            "id": game_id,
            "matchday": matchday,
            "date": str(match["date"]),
            "home_team": team_names[home_team],
            "away_team": team_names[away_team],
            "home_score": int(match["home_goals"]),
            "away_score": int(match["away_goals"]),
            "home_xg": float(match["home_xg"]),
            "away_xg": float(match["away_xg"]),
            "needs_review": needs_review
        })
        
        if matchday not in matchdays_data:
            matchdays_data[matchday] = []
        matchdays_data[matchday].append({
            "id": game_id,
            "home": team_names[home_team],
            "away": team_names[away_team]
        })

    # Save index
    index_file = os.path.join(PUBLIC_DATA_DIR, "index.json")
    with open(index_file, "w") as f:
        json.dump(index_data, f, indent=2)
        
    with open(VALIDATION_FILE, "w") as f:
        json.dump(validation_report, f, indent=2)
        
    save_team_names(team_names)
    
    print("\n--- SUMMARY ---")
    print(f"Total processed: {len(target_matches)}")
    print(f"Validation failures: {len(validation_report)}")
    for gid, errs in validation_report.items():
        print(f"  - Match {gid}: {errs}")
    print(f"Missing team names added: {len(missing_teams)}")
    if missing_teams:
        print(f"  {missing_teams}")

    print("\n--- MATCHDAY VALIDATION ---")
    all_teams_ever = set(team_names.values())
    
    for md, md_matches in sorted(matchdays_data.items()):
        seen_teams = set()
        duplicates = set()
        
        for m in md_matches:
            if m["home"] in seen_teams: duplicates.add(m["home"])
            if m["away"] in seen_teams: duplicates.add(m["away"])
            seen_teams.add(m["home"])
            seen_teams.add(m["away"])
            
        print(f"Matchday {md}: {len(md_matches)} matches")
        if duplicates:
            print(f"  ERROR: Duplicate teams found: {duplicates}")
        if len(md_matches) < 10:
            missing = all_teams_ever - seen_teams
            print(f"  WARNING: Incomplete matchday. Missing {10 - len(md_matches)} match(es).")
            print(f"  Teams missing: {missing}")

if __name__ == "__main__":
    main()

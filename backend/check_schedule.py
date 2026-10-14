import os
import pandas as pd
import soccerdata as sd
CACHE_DIR = os.path.join(os.path.dirname(__file__), "data", "cache")
os.environ["SOCCERDATA_DIR"] = CACHE_DIR
us = sd.Understat(leagues="ESP-La Liga", seasons="2026")
schedule = us.read_schedule()
played = schedule[schedule["is_result"] == True].copy()
played.sort_values(by="date", inplace=True)
print(f"Total played matches: {len(played)}")
print(played[["date", "home_team", "away_team"]].head(35))

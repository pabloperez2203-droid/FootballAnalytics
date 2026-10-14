import soccerdata as sd
import os
os.environ["SOCCERDATA_DIR"] = "backend/data/cache"
us = sd.Understat(leagues="ESP-La Liga", seasons="2026")
players = us.read_player_match_stats(match_id=[30770])
print(players.columns.tolist())

import json
import os

index_file = "public/data/matches/index.json"
with open(index_file, "r") as f:
    matches = json.load(f)

for m in matches:
    h = m["home_team"]
    a = m["away_team"]
    if h == "Valencia" and a == "Real Betis":
        print(f"Valencia - Real Betis: ID {m['id']}, Matchday {m['matchday']}")
    elif h == "Real Madrid" and a == "Real Sociedad":
        print(f"Real Madrid - Real Sociedad: ID {m['id']}, Matchday {m['matchday']}")
    elif h == "Celta Vigo" and a == "Osasuna":
        print(f"Celta Vigo - Osasuna: ID {m['id']}, Matchday {m['matchday']}")
    elif h == "Barcelona" and a == "Athletic Club":
        print(f"Barcelona - Athletic Club: ID {m['id']}, Matchday {m['matchday']}")

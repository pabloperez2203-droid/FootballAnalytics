import urllib.request
import json

API_KEY = '33656f524ab04b98b4acbc52865f71c7'
headers = { 'X-Auth-Token': API_KEY }

teams_data = []

for comp in ['PD', 'SD']:
    try:
        req = urllib.request.Request(f'http://api.football-data.org/v4/competitions/{comp}/teams', headers=headers)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            for t in data.get('teams', []):
                teams_data.append({'name': t['name'], 'shortName': t['shortName'], 'crest': t['crest']})
    except Exception as e:
        print(f"Failed {comp}: {e}")

print(f"Total teams fetched: {len(teams_data)}")
import sys
json.dump(teams_data, sys.stdout)
